import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

const statusSchema = z.enum(["PENDING", "IN_PROGRESS", "FOR_REVIEW", "COMPLETED"]);

const patchSchema = z.object({
  status: statusSchema,
});

function serializeRow(row: {
  id: string;
  ticketId: string;
  type: string;
  status: string;
  reportedEnvironment: string;
  userDescription: string;
  reporterUserId: string;
  reporterEmail: string;
  reporterRole: string;
  currentUrl: string;
  userAgent: string;
  elementDiagnostics: unknown;
  apiPrerequisite: unknown;
  screenshotUrl: string | null;
  fullPayload: unknown;
  createdAt: Date;
}) {
  return {
    id: row.id,
    ticketId: row.ticketId,
    type: row.type,
    status: row.status,
    reportedEnvironment: row.reportedEnvironment,
    userDescription: row.userDescription,
    reporterUserId: row.reporterUserId,
    reporterEmail: row.reporterEmail,
    reporterRole: row.reporterRole,
    currentUrl: row.currentUrl,
    userAgent: row.userAgent,
    elementDiagnostics: row.elementDiagnostics,
    apiPrerequisite: row.apiPrerequisite,
    screenshotUrl: row.screenshotUrl,
    fullPayload: row.fullPayload,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const take = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = Math.max(0, Number(req.query.offset) || 0);
    const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
    const statusFilter = statusRaw ? statusSchema.safeParse(statusRaw) : null;
    const reporterUserId =
      typeof req.query.reporterUserId === "string" ? req.query.reporterUserId.trim() : "";
    const where: Prisma.DebugCaptureTicketWhereInput = {
      ...(statusFilter?.success ? { status: statusFilter.data } : {}),
      ...(reporterUserId ? { reporterUserId } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.debugCaptureTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.debugCaptureTicket.count({ where }),
    ]);

    res.json({
      data: rows.map(serializeRow),
      total,
    });
  } catch (error) {
    console.error("debug portal list error:", error);
    res.status(500).json({ error: "Failed to list tickets" });
  }
});

router.get("/reporters", async (_req, res) => {
  try {
    const rows = await prisma.debugCaptureTicket.findMany({
      distinct: ["reporterUserId"],
      select: { reporterUserId: true, reporterEmail: true },
      orderBy: { reporterEmail: "asc" },
    });
    res.json({ data: rows });
  } catch (error) {
    console.error("debug portal reporters error:", error);
    res.status(500).json({ error: "Failed to list reporters" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.debugCaptureTicket.findUnique({
      where: { id: req.params.id },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeRow(row) });
  } catch (error) {
    console.error("debug portal get error:", error);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const { status } = patchSchema.parse(req.body);
    const row = await prisma.debugCaptureTicket.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ data: serializeRow(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    const code = (error as { code?: string })?.code;
    if (code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    console.error("debug portal patch error:", error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

export { router as debugPortalTicketRoutes };
