import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth.js";
import {
  MAX_TICKET_SCREENSHOTS,
  resolveDebugPortalUser,
  screenshotFieldsFromInput,
  ticketScreenshotUrls,
  type DebugPortalUser,
} from "../lib/debug-portal-user.js";
import { logDebugTicket, serializeDebugTicketLog, type DebugTicketActor } from "../lib/debug-ticket-log.js";

const router: IRouter = Router();

function actorOf(user: DebugPortalUser): DebugTicketActor {
  return { userId: user.id, email: user.email };
}

type PortalRequest = AuthRequest & { portalUser?: DebugPortalUser };

/** Any TBOS account may use the portal; non-admins only see and add to their own tickets. */
router.use(async (req: PortalRequest, res, next) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  const user = await resolveDebugPortalUser(req.user.id);
  if (!user) return res.status(403).json({ error: "Forbidden" });
  req.portalUser = user;
  next();
});

function requirePortalAdmin(req: PortalRequest, res: import("express").Response): boolean {
  if (req.portalUser?.isAdmin) return true;
  res.status(403).json({ error: "Only admins can change ticket status" });
  return false;
}

/** Non-admins may only close a reviewed ticket or reopen a completed one. */
const MEMBER_STATUS_MOVES: ReadonlyArray<[string, string]> = [
  ["FOR_REVIEW", "COMPLETED"],
  ["COMPLETED", "PENDING"],
];

function canChangeStatus(user: DebugPortalUser, from: string, to: string): boolean {
  if (user.isAdmin) return true;
  return MEMBER_STATUS_MOVES.some(([a, b]) => a === from && b === to);
}

function canViewTicket(user: DebugPortalUser, row: { reporterUserId: string }): boolean {
  return user.isAdmin || row.reporterUserId === user.id;
}

const screenshotUrlSchema = z.string().trim().min(1).max(2000);

const statusSchema = z.enum(["PENDING", "IN_PROGRESS", "FOR_REVIEW", "COMPLETED"]);

/** Status changes are admin-only; content fields can be edited by the reporter or an admin. */
const patchSchema = z
  .object({
    status: statusSchema.optional(),
    type: z.enum(["BUG", "ENHANCEMENT"]).optional(),
    reportedEnvironment: z.enum(["development", "staging", "production"]).optional(),
    userDescription: z.string().trim().min(1).max(20_000).optional(),
    currentUrl: z.string().trim().max(2000).optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "Nothing to update",
  });

const EDITABLE_FIELDS = ["type", "reportedEnvironment", "userDescription", "currentUrl"] as const;

const removeScreenshotSchema = z.object({ screenshotUrl: screenshotUrlSchema });

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
  screenshotUrls: z.array(screenshotUrlSchema).max(MAX_TICKET_SCREENSHOTS).optional(),
});

const addScreenshotsSchema = z.object({
  screenshotUrls: z.array(screenshotUrlSchema).min(1).max(MAX_TICKET_SCREENSHOTS),
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
  screenshotUrls?: string[];
  fullPayload: unknown;
  createdAt: Date;
}) {
  const screenshotUrls = ticketScreenshotUrls(row);
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
    screenshotUrl: screenshotUrls[0] ?? null,
    screenshotUrls,
    fullPayload: row.fullPayload,
    createdAt: row.createdAt.toISOString(),
  };
}

router.post("/", async (req: PortalRequest, res) => {
  try {
    const adminUser = req.portalUser!;
    const input = portalCreateSchema.parse(req.body);
    const screenshots = screenshotFieldsFromInput(input);

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
      screenshotUrl: screenshots.screenshotUrl,
      screenshotUrls: screenshots.screenshotUrls,
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
            screenshotUrl: screenshots.screenshotUrl,
            screenshotUrls: screenshots.screenshotUrls,
            fullPayload: asInputJson(fullPayload),
          },
        });
        await logDebugTicket(prisma, row.id, actorOf(adminUser), [{ action: "CREATED" }]);
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

router.get("/", async (req: PortalRequest, res) => {
  try {
    // Up to 500 so the kanban board can show every ticket at once.
    const take = Math.min(500, Math.max(1, Number(req.query.limit) || 50));
    const skip = Math.max(0, Number(req.query.offset) || 0);
    const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
    const statusFilter = statusRaw ? statusSchema.safeParse(statusRaw) : null;
    const requestedReporter =
      typeof req.query.reporterUserId === "string" ? req.query.reporterUserId.trim() : "";
    const reporterUserId = req.portalUser!.isAdmin ? requestedReporter : req.portalUser!.id;
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

router.get("/reporters", async (req: PortalRequest, res) => {
  try {
    const rows = await prisma.debugCaptureTicket.findMany({
      where: req.portalUser!.isAdmin ? {} : { reporterUserId: req.portalUser!.id },
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

router.patch("/bulk-status", async (req: PortalRequest, res) => {
  try {
    if (!requirePortalAdmin(req, res)) return;
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

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.debugCaptureTicket.updateMany({
        where: { id: { in: uniqueIds }, status: requiredFrom },
        data: { status },
      });
      for (const id of uniqueIds) {
        await logDebugTicket(tx, id, actorOf(req.portalUser!), [
          { action: "STATUS_CHANGED", field: "status", oldValue: requiredFrom, newValue: status },
        ]);
      }
      return updated;
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

/** Ticket detail plus its activity log (newest first). */
async function ticketDetail(id: string) {
  const row = await prisma.debugCaptureTicket.findUnique({
    where: { id },
    include: { logs: { orderBy: { createdAt: "desc" } } },
  });
  if (!row) return null;
  return { ...serializeRow(row), logs: row.logs.map(serializeDebugTicketLog) };
}

router.get("/:id", async (req: PortalRequest, res) => {
  try {
    const row = await prisma.debugCaptureTicket.findUnique({
      where: { id: req.params.id },
      select: { reporterUserId: true },
    });
    if (!row || !canViewTicket(req.portalUser!, row)) return res.status(404).json({ error: "Not found" });
    res.json({ data: await ticketDetail(req.params.id!) });
  } catch (error) {
    console.error("debug portal get error:", error);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

/** Attach more screenshots to an existing ticket (reporter or admin). */
router.post("/:id/screenshots", async (req: PortalRequest, res) => {
  try {
    const { screenshotUrls: added } = addScreenshotsSchema.parse(req.body);
    const row = await prisma.debugCaptureTicket.findUnique({ where: { id: req.params.id } });
    if (!row || !canViewTicket(req.portalUser!, row)) return res.status(404).json({ error: "Not found" });

    const existing = ticketScreenshotUrls(row);
    const merged = [...new Set([...existing, ...added])];
    if (merged.length > MAX_TICKET_SCREENSHOTS) {
      return res
        .status(400)
        .json({ error: `A ticket can have at most ${MAX_TICKET_SCREENSHOTS} screenshots.` });
    }
    const newOnes = merged.length - existing.length;

    await prisma.$transaction(async (tx) => {
      await tx.debugCaptureTicket.update({
        where: { id: row.id },
        data: { screenshotUrls: merged, screenshotUrl: merged[0] ?? null },
      });
      if (newOnes > 0) {
        await logDebugTicket(tx, row.id, actorOf(req.portalUser!), [
          { action: "SCREENSHOTS_ADDED", field: "screenshots", oldValue: String(existing.length), newValue: String(merged.length) },
        ]);
      }
    });
    res.json({ data: await ticketDetail(row.id) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal add screenshots error:", error);
    res.status(500).json({ error: "Failed to add screenshots" });
  }
});

/** Remove one screenshot from a ticket (reporter or admin). */
router.delete("/:id/screenshots", async (req: PortalRequest, res) => {
  try {
    const { screenshotUrl } = removeScreenshotSchema.parse(req.body);
    const row = await prisma.debugCaptureTicket.findUnique({ where: { id: req.params.id } });
    if (!row || !canViewTicket(req.portalUser!, row)) return res.status(404).json({ error: "Not found" });

    const existing = ticketScreenshotUrls(row);
    if (!existing.includes(screenshotUrl)) return res.status(404).json({ error: "Screenshot not found" });
    const remaining = existing.filter((url) => url !== screenshotUrl);

    await prisma.$transaction(async (tx) => {
      await tx.debugCaptureTicket.update({
        where: { id: row.id },
        data: { screenshotUrls: remaining, screenshotUrl: remaining[0] ?? null },
      });
      await logDebugTicket(tx, row.id, actorOf(req.portalUser!), [
        { action: "SCREENSHOT_REMOVED", field: "screenshots", oldValue: String(existing.length), newValue: String(remaining.length) },
      ]);
    });
    res.json({ data: await ticketDetail(row.id) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal remove screenshot error:", error);
    res.status(500).json({ error: "Failed to remove screenshot" });
  }
});

router.patch("/:id", async (req: PortalRequest, res) => {
  try {
    const user = req.portalUser!;
    const body = patchSchema.parse(req.body);
    const row = await prisma.debugCaptureTicket.findUnique({ where: { id: req.params.id } });
    if (!row || !canViewTicket(user, row)) return res.status(404).json({ error: "Not found" });
    if (body.status !== undefined && body.status !== row.status && !canChangeStatus(user, row.status, body.status)) {
      return res.status(403).json({
        error: "You can only move a ticket from For review to Completed, or from Completed back to Pending.",
      });
    }

    const data: Prisma.DebugCaptureTicketUpdateInput = {};
    const entries: Parameters<typeof logDebugTicket>[3] = [];
    if (body.status !== undefined && body.status !== row.status) {
      data.status = body.status;
      entries.push({ action: "STATUS_CHANGED", field: "status", oldValue: row.status, newValue: body.status });
    }
    for (const field of EDITABLE_FIELDS) {
      const next = body[field];
      if (next === undefined) continue;
      const value = field === "currentUrl" ? next || "manual://debug-portal" : next;
      if (value === row[field]) continue;
      data[field] = value as never;
      entries.push({ action: "UPDATED", field, oldValue: String(row[field] ?? ""), newValue: String(value) });
    }

    if (entries.length) {
      await prisma.$transaction(async (tx) => {
        await tx.debugCaptureTicket.update({ where: { id: row.id }, data });
        await logDebugTicket(tx, row.id, actorOf(user), entries);
      });
    }
    res.json({ data: await ticketDetail(row.id) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal patch error:", error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

export { router as debugPortalTicketRoutes };
