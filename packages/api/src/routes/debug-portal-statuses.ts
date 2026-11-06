import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth.js";
import { resolveDebugPortalUser } from "../lib/debug-portal-user.js";
import {
  DEBUG_STATUS_COLORS,
  listDebugTicketStatuses,
  serializeDebugTicketStatus,
  statusKeyFromLabel,
} from "../lib/debug-ticket-statuses.js";

const router: IRouter = Router();

const labelSchema = z.string().trim().min(1).max(40);
const createSchema = z.object({ label: labelSchema, color: z.enum(DEBUG_STATUS_COLORS).default("slate") });
const updateSchema = z
  .object({ label: labelSchema.optional(), color: z.enum(DEBUG_STATUS_COLORS).optional() })
  .refine((body) => body.label !== undefined || body.color !== undefined, { message: "Nothing to update" });
const reorderSchema = z.object({ keys: z.array(z.string().min(1)).min(1).max(100) });

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

async function respondWithAll(res: Response, status = 200) {
  const rows = await listDebugTicketStatuses();
  res.status(status).json({ data: rows.map(serializeDebugTicketStatus) });
}

router.get("/", async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id || !(await resolveDebugPortalUser(req.user.id))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await respondWithAll(res);
  } catch (error) {
    console.error("debug statuses list error:", error);
    res.status(500).json({ error: "Failed to load statuses" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { label, color } = createSchema.parse(req.body);
    const last = await prisma.debugTicketStatus.findFirst({ orderBy: { position: "desc" }, select: { position: true } });
    await prisma.debugTicketStatus.create({
      data: { key: await statusKeyFromLabel(label), label, color, position: (last?.position ?? -1) + 1 },
    });
    await respondWithAll(res, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug status create error:", error);
    res.status(500).json({ error: "Failed to add status" });
  }
});

/** Save the board column order (all keys, left to right). */
router.put("/order", async (req: AuthRequest, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { keys } = reorderSchema.parse(req.body);
    const existing = await listDebugTicketStatuses();
    const known = new Set(existing.map((row) => row.key));
    if (keys.length !== known.size || keys.some((key) => !known.has(key)) || new Set(keys).size !== keys.length) {
      return res.status(400).json({ error: "Order must list every status exactly once" });
    }
    await prisma.$transaction(
      keys.map((key, position) => prisma.debugTicketStatus.update({ where: { key }, data: { position } })),
    );
    await respondWithAll(res);
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
    const row = await prisma.debugTicketStatus.findUnique({ where: { key: req.params.key } });
    if (!row) return res.status(404).json({ error: "Status not found" });
    await prisma.debugTicketStatus.update({ where: { key: row.key }, data: body });
    await respondWithAll(res);
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
    const row = await prisma.debugTicketStatus.findUnique({ where: { key: req.params.key } });
    if (!row) return res.status(404).json({ error: "Status not found" });
    if (row.isSystem) {
      return res.status(400).json({ error: "Built-in statuses can be renamed but not deleted" });
    }
    const inUse = await prisma.debugCaptureTicket.count({ where: { status: row.key } });
    if (inUse > 0) {
      return res.status(400).json({
        error: `Move the ${inUse} ticket${inUse === 1 ? "" : "s"} in "${row.label}" to another column first.`,
      });
    }
    await prisma.debugTicketStatus.delete({ where: { key: row.key } });
    await respondWithAll(res);
  } catch (error) {
    console.error("debug status delete error:", error);
    res.status(500).json({ error: "Failed to delete status" });
  }
});

export { router as debugPortalStatusRoutes };
