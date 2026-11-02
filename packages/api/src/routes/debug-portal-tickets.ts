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

const bulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: statusSchema,
});

function bulkAdvanceFromStatus(to: z.infer<typeof statusSchema>): z.infer<typeof statusSchema> | null {
  switch (to) {
    case "IN_PROGRESS":
      return "PENDING";
    case "FOR_REVIEW":
      return "IN_PROGRESS";
    case "COMPLETED":
      return "FOR_REVIEW";
    default:
      return null;
  }
}

const portalCreateSchema = z.object({
  type: z.enum(["BUG", "ENHANCEMENT"]),
  reportedEnvironment: z.enum(["development", "staging", "production"]).default("development"),
  userDescription: z.string().min(1).max(20_000),
  currentUrl: z.string().max(2000).optional(),
  screenshotUrl: z.string().max(2000).nullable().optional(),
});

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function clientIpFromRequest(req: AuthRequest): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0]?.trim() ?? null;
  }
  return req.ip ?? null;
}

function manualElementDiagnostics(): Prisma.InputJsonValue {
  return {
    tagName: "MANUAL",
    id: null,
    className: null,
    cssSelector: "manual",
    innerText: null,
    boundingRect: { top: 0, left: 0, width: 0, height: 0 },
    captureScope: "manual",
  };
}

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

router.post("/", async (req: AuthRequest, res) => {
  try {
    const u = req.user;
    if (!u?.id) return res.status(401).json({ error: "Unauthorized" });

    const input = portalCreateSchema.parse(req.body);
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: u.id },
      select: { id: true, email: true, role: true, active: true },
    });
    if (!adminUser || adminUser.active === false) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const userAgent =
      typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : "debug-portal";
    const currentUrl = input.currentUrl?.trim() || "manual://debug-portal";
    const clientIp = clientIpFromRequest(req);
    const ticketId = `TICK-${Date.now()}`;
    const elementDiagnostics = manualElementDiagnostics();

    const fullPayload = {
      source: "debug_portal_manual",
      ticketId,
      timestamp: new Date().toISOString(),
      type: input.type,
      reportedEnvironment: input.reportedEnvironment,
      userDescription: input.userDescription,
      userMetadata: {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        userAgent,
        currentUrl,
        clientIp,
      },
      elementDiagnostics,
      apiPrerequisite: null,
      screenshotUrl: input.screenshotUrl ?? null,
    };

    let attemptId = ticketId;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const row = await prisma.debugCaptureTicket.create({
          data: {
            ticketId: attemptId,
            type: input.type,
            reportedEnvironment: input.reportedEnvironment,
            userDescription: input.userDescription.trim(),
            reporterUserId: adminUser.id,
            reporterEmail: adminUser.email,
            reporterRole: adminUser.role,
            currentUrl,
            userAgent,
            elementDiagnostics,
            apiPrerequisite: undefined,
            screenshotUrl: input.screenshotUrl ?? null,
            fullPayload: asInputJson(fullPayload),
          },
        });
        return res.status(201).json({ data: serializeRow(row) });
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === "P2002" && attempt < 2) {
          attemptId = `TICK-${Date.now()}-${attempt + 1}`;
          continue;
        }
        throw err;
      }
    }
    return res.status(500).json({ error: "Failed to create ticket" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal create error:", error);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

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

router.patch("/bulk-status", async (req: AuthRequest, res) => {
  try {
    const { ids, status } = bulkStatusSchema.parse(req.body);
    const requiredFrom = bulkAdvanceFromStatus(status);
    if (!requiredFrom) {
      return res.status(400).json({ error: "Invalid bulk target status" });
    }

    const uniqueIds = [...new Set(ids)];
    const rows = await prisma.debugCaptureTicket.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, status: true },
    });

    if (rows.length !== uniqueIds.length) {
      return res.status(404).json({ error: "One or more tickets were not found" });
    }

    const invalid = rows.filter((r) => r.status !== requiredFrom);
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `All tickets must be ${requiredFrom} to move to ${status}`,
        invalidIds: invalid.map((r) => r.id),
      });
    }

    const result = await prisma.debugCaptureTicket.updateMany({
      where: { id: { in: uniqueIds }, status: requiredFrom },
      data: { status },
    });

    res.json({
      data: {
        updated: result.count,
        status,
        previousStatus: requiredFrom,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal bulk status error:", error);
    res.status(500).json({ error: "Failed to bulk update status" });
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
