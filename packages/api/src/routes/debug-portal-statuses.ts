import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth.js";
import { resolveDebugPortalUser } from "../lib/debug-portal-user.js";
import {
  DEBUG_STATUS_COLORS,
  listDebugTicketStatuses,
  parseBoardFamily,
  serializeDebugTicketStatus,
  statusKeyFromLabel,
  type BoardFamily,
} from "../lib/debug-ticket-statuses.js";

const router: IRouter = Router();

const familySchema = z.enum(["WORK", "STRATEGY"]);
const labelSchema = z.string().trim().min(1).max(40);
const createSchema = z.object({
  label: labelSchema,
  color: z.enum(DEBUG_STATUS_COLORS).default("slate"),
  boardFamily: familySchema.default("WORK"),
});
const updateSchema = z
  .object({ label: labelSchema.optional(), color: z.enum(DEBUG_STATUS_COLORS).optional() })
  .refine((body) => body.label !== undefined || body.color !== undefined, { message: "Nothing to update" });
const reorderSchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(100),
  boardFamily: familySchema.default("WORK"),
});

async function requireAdmin(req: AuthRequest, res: Response): Promise<boolean> {
  const user = req.user?.id ? await resolveDebugPortalUser(req.user.id) : null;
  if (!user) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: "Only admins can manage board statuses" });
    return false;
  }
  return true;
}

function familyFromQuery(req: AuthRequest): BoardFamily {
  const raw = typeof req.query.boardFamily === "string" ? req.query.boardFamily : undefined;
  return parseBoardFamily(raw);
}

async function respondWithFamily(res: Response, family: BoardFamily, status = 200) {
  const rows = await listDebugTicketStatuses(family);
  res.status(status).json({ data: rows.map(serializeDebugTicketStatus) });
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id || !(await resolveDebugPortalUser(req.user.id))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const family = familyFromQuery(req);
    // `?all=1` returns both families (detail/list badge resolution).
    if (req.query.all === "1" || req.query.all === "true") {
      const [work, strategy] = await Promise.all([
        listDebugTicketStatuses("WORK"),
        listDebugTicketStatuses("STRATEGY"),
      ]);
      return res.json({
        data: [...work, ...strategy].map(serializeDebugTicketStatus),
      });
    }
    await respondWithFamily(res, family);
  } catch (error) {
    console.error("debug statuses list error:", error);
    res.status(500).json({ error: "Failed to load statuses" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { label, color, boardFamily } = createSchema.parse(req.body);
    const last = await prisma.debugTicketStatus.findFirst({
      where: { boardFamily },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await prisma.debugTicketStatus.create({
      data: {
        boardFamily,
        key: await statusKeyFromLabel(label, boardFamily),
        label,
        color,
        position: (last?.position ?? -1) + 1,
      },
    });
    await respondWithFamily(res, boardFamily, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug status create error:", error);
    res.status(500).json({ error: "Failed to add status" });
  }
});

/** Save the board column order (all keys in the family, left to right). */
router.put("/order", async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { keys, boardFamily } = reorderSchema.parse(req.body);
    const existing = await listDebugTicketStatuses(boardFamily);
    const known = new Set(existing.map((row) => row.key));
    if (keys.length !== known.size || keys.some((key) => !known.has(key)) || new Set(keys).size !== keys.length) {
      return res.status(400).json({ error: "Order must list every status exactly once" });
    }
    await prisma.$transaction(
      keys.map((key, position) =>
        prisma.debugTicketStatus.update({
          where: { boardFamily_key: { boardFamily, key } },
          data: { position },
        }),
      ),
    );
    await respondWithFamily(res, boardFamily);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug status reorder error:", error);
    res.status(500).json({ error: "Failed to save column order" });
  }
});

router.patch("/:key", async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const body = updateSchema.parse(req.body);
    const family = parseBoardFamily(
      typeof req.query.boardFamily === "string"
        ? req.query.boardFamily
        : typeof req.body?.boardFamily === "string"
          ? req.body.boardFamily
          : "WORK",
    );
    const row = await prisma.debugTicketStatus.findUnique({
      where: { boardFamily_key: { boardFamily: family, key: req.params.key } },
    });
    if (!row) return res.status(404).json({ error: "Status not found" });
    await prisma.debugTicketStatus.update({
      where: { boardFamily_key: { boardFamily: family, key: row.key } },
      data: { label: body.label, color: body.color },
    });
    await respondWithFamily(res, family);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug status update error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.delete("/:key", async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const family = parseBoardFamily(
      typeof req.query.boardFamily === "string" ? req.query.boardFamily : "WORK",
    );
    const row = await prisma.debugTicketStatus.findUnique({
      where: { boardFamily_key: { boardFamily: family, key: req.params.key } },
    });
    if (!row) return res.status(404).json({ error: "Status not found" });
    const familyCount = await prisma.debugTicketStatus.count({ where: { boardFamily: family } });
    if (familyCount <= 1) {
      return res.status(400).json({ error: "Keep at least one status column on this board." });
    }
    const inUse = await prisma.debugCaptureTicket.count({
      where: {
        status: row.key,
        hierarchyLevel: family === "STRATEGY" ? { in: [1, 2] } : { in: [0, -1] },
      },
    });
    if (inUse > 0) {
      return res.status(400).json({
        error: `Move the ${inUse} ticket${inUse === 1 ? "" : "s"} in "${row.label}" to another column first.`,
      });
    }
    await prisma.debugTicketStatus.delete({
      where: { boardFamily_key: { boardFamily: family, key: row.key } },
    });
    await respondWithFamily(res, family);
  } catch (error) {
    console.error("debug status delete error:", error);
    res.status(500).json({ error: "Failed to delete status" });
  }
});

export { router as debugPortalStatusRoutes };
