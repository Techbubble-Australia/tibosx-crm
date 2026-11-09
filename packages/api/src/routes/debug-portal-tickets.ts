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
import { isDebugTicketStatus, previousDebugTicketStatus } from "../lib/debug-ticket-statuses.js";
import { activeDebugSprintId } from "../lib/debug-sprints.js";
import { notifyAsync } from "../lib/notifications/index.js";

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

/** Any key from DebugTicketStatus (validated against the table before saving). */
const statusSchema = z.string().trim().min(1).max(60);

/** Status changes are admin-only; content fields can be edited by the reporter or an admin. */
const patchSchema = z
  .object({
    status: statusSchema.optional(),
    type: z.enum(["BUG", "ENHANCEMENT"]).optional(),
    reportedEnvironment: z.enum(["development", "staging", "production"]).optional(),
    userDescription: z.string().trim().min(1).max(20_000).optional(),
    currentUrl: z.string().trim().max(2000).optional(),
    /** Admin-only: move the ticket into a sprint (null = backlog). */
    sprintId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "Nothing to update",
  });

/** Ticket details only the creator may change (status and sprint follow their own rules). */
const EDITABLE_FIELDS = ["type", "reportedEnvironment", "userDescription", "currentUrl"] as const;

const ONLY_CREATOR_ERROR = "Only the person who created this ticket can edit or delete it.";

const removeScreenshotSchema = z.object({ screenshotUrl: screenshotUrlSchema });

const bulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: statusSchema,
  /** Status every selected ticket must currently have; defaults to the column before `status`. */
  fromStatus: statusSchema.optional(),
});

const portalCreateSchema = z.object({
  type: z.enum(["BUG", "ENHANCEMENT"]),
  reportedEnvironment: z.enum(["development", "staging", "production"]).default("development"),
  userDescription: z.string().min(1).max(20_000),
  currentUrl: z.string().max(2000).optional(),
  screenshotUrl: z.string().max(2000).nullable().optional(),
  screenshotUrls: z.array(screenshotUrlSchema).max(MAX_TICKET_SCREENSHOTS).optional(),
  /** Board "+" on a column: admins may start the ticket in that column; others always start in PENDING. */
  status: z.string().trim().min(1).max(60).optional(),
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

const SPRINT_SELECT = { id: true, name: true, status: true } as const;

const LOCKED_SPRINT_ERROR = "This ticket's sprint is completed and locked. Only admins can change it.";

/** Tickets in a completed sprint are read-only for non-admins. */
async function lockedForUser(user: DebugPortalUser, sprintId: string | null): Promise<boolean> {
  if (user.isAdmin || !sprintId) return false;
  const sprint = await prisma.debugSprint.findUnique({ where: { id: sprintId }, select: { status: true } });
  return sprint?.status === "COMPLETED";
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
  sprintId?: string | null;
  sprint?: { id: string; name: string; status: string } | null;
}) {
  const screenshotUrls = ticketScreenshotUrls(row);
  return {
    sprintId: row.sprintId ?? null,
    sprintName: row.sprint?.name ?? null,
    sprintStatus: row.sprint?.status ?? null,
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

    const sprintId = await activeDebugSprintId();
    const initialStatus =
      adminUser.isAdmin && input.status && (await isDebugTicketStatus(input.status)) ? input.status : "PENDING";
    let attemptId = ticketId;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const row = await prisma.debugCaptureTicket.create({
          data: {
            ticketId: attemptId,
            type: input.type,
            status: initialStatus,
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
            sprintId,
          },
          include: { sprint: { select: SPRINT_SELECT } },
        });
        await logDebugTicket(prisma, row.id, actorOf(adminUser), [{ action: "CREATED" }]);
        notifyAsync("debug_ticket.created", { ticketId: row.id });
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
    // sprintId: "" = every ticket, "none" = backlog (no sprint), otherwise one sprint.
    const sprintParam = typeof req.query.sprintId === "string" ? req.query.sprintId.trim() : "";
    const where: Prisma.DebugCaptureTicketWhereInput = {
      ...(statusFilter?.success ? { status: statusFilter.data } : {}),
      ...(reporterUserId ? { reporterUserId } : {}),
      ...(sprintParam === "none" ? { sprintId: null } : sprintParam ? { sprintId: sprintParam } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.debugCaptureTicket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: { sprint: { select: SPRINT_SELECT } },
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
    const { ids, status, fromStatus } = bulkStatusSchema.parse(req.body);
    if (!(await isDebugTicketStatus(status))) {
      return res.status(400).json({ error: "Unknown status" });
    }
    const requiredFrom = fromStatus ?? (await previousDebugTicketStatus(status));
    if (!requiredFrom || requiredFrom === status) {
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
    for (const id of uniqueIds) {
      notifyAsync("debug_ticket.status.changed", {
        ticketId: id,
        oldStatus: requiredFrom,
        newStatus: status,
        actorEmail: req.portalUser!.email,
      });
    }

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

const commentAttachmentSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .refine((u) => u.startsWith("/uploads/") || /^https:\/\//.test(u), "Invalid attachment URL"),
  name: z.string().trim().min(1).max(255),
  kind: z.enum(["image", "file"]),
  size: z.number().int().nonnegative().optional(),
});

type CommentAttachment = z.infer<typeof commentAttachmentSchema>;

function commentAttachments(raw: unknown): CommentAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = commentAttachmentSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

function serializeComment(row: {
  id: string;
  authorUserId: string;
  authorEmail: string;
  authorName: string | null;
  body: string;
  attachments?: unknown;
  editedAt?: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    authorUserId: row.authorUserId,
    authorEmail: row.authorEmail,
    authorName: row.authorName,
    body: row.body,
    attachments: commentAttachments(row.attachments),
    editedAt: row.editedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Ticket detail plus its activity log (newest first) and comments (oldest first). */
async function ticketDetail(id: string) {
  const row = await prisma.debugCaptureTicket.findUnique({
    where: { id },
    include: {
      logs: { orderBy: { createdAt: "desc" } },
      comments: { orderBy: { createdAt: "asc" } },
      sprint: { select: SPRINT_SELECT },
    },
  });
  if (!row) return null;
  return {
    ...serializeRow(row),
    logs: row.logs.map(serializeDebugTicketLog),
    comments: row.comments.map(serializeComment),
  };
}

/** Short text for the activity log: the start of the comment, or the attachment count when there's no text. */
function commentLogPreview(body: string, attachmentCount: number): string {
  const text = body.replace(/\s+/g, " ").trim();
  if (text) return text.length > 160 ? `${text.slice(0, 157)}…` : text;
  return `${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`;
}

const commentSchema = z
  .object({
    body: z.string().trim().max(5000).default(""),
    attachments: z.array(commentAttachmentSchema).max(10, "Up to 10 attachments per comment").default([]),
  })
  .refine((c) => c.body.length > 0 || c.attachments.length > 0, { message: "Write a comment or attach a file" });

/** Anyone who can open the ticket can comment (including on completed sprints). */
router.post("/:id/comments", async (req: PortalRequest, res) => {
  try {
    const user = req.portalUser!;
    const { body, attachments } = commentSchema.parse(req.body);
    const row = await prisma.debugCaptureTicket.findUnique({
      where: { id: req.params.id },
      select: { id: true, reporterUserId: true },
    });
    if (!row || !canViewTicket(user, row)) return res.status(404).json({ error: "Not found" });
    const created = await prisma.$transaction(async (tx) => {
      const comment = await tx.debugCaptureTicketComment.create({
        data: {
          ticketId: row.id,
          authorUserId: user.id,
          authorEmail: user.email,
          authorName: user.name || null,
          body,
          attachments,
        },
      });
      await logDebugTicket(tx, row.id, actorOf(user), [
        { action: "COMMENT_ADDED", newValue: commentLogPreview(body, attachments.length) },
      ]);
      return comment;
    });
    res.status(201).json({ data: serializeComment(created) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message ?? "Validation error", details: error.errors });
    }
    console.error("debug portal comment create error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

/** Only the author can edit a comment (text and attachments are replaced). */
router.patch("/:id/comments/:commentId", async (req: PortalRequest, res) => {
  try {
    const user = req.portalUser!;
    const { body, attachments } = commentSchema.parse(req.body);
    const comment = await prisma.debugCaptureTicketComment.findFirst({
      where: { id: req.params.commentId, ticketId: req.params.id },
      include: { ticket: { select: { reporterUserId: true } } },
    });
    if (!comment || !canViewTicket(user, comment.ticket)) return res.status(404).json({ error: "Not found" });
    if (comment.authorUserId !== user.id) {
      return res.status(403).json({ error: "You can only edit your own comments" });
    }
    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.debugCaptureTicketComment.update({
        where: { id: comment.id },
        data: { body, attachments, editedAt: new Date() },
      });
      await logDebugTicket(tx, comment.ticketId, actorOf(user), [
        {
          action: "COMMENT_EDITED",
          oldValue: commentLogPreview(comment.body, commentAttachments(comment.attachments).length),
          newValue: commentLogPreview(body, attachments.length),
        },
      ]);
      return next;
    });
    res.json({ data: serializeComment(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message ?? "Validation error", details: error.errors });
    }
    console.error("debug portal comment update error:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

/** Authors can delete their own comments; admins can remove any. */
router.delete("/:id/comments/:commentId", async (req: PortalRequest, res) => {
  try {
    const user = req.portalUser!;
    const comment = await prisma.debugCaptureTicketComment.findFirst({
      where: { id: req.params.commentId, ticketId: req.params.id },
      include: { ticket: { select: { reporterUserId: true } } },
    });
    if (!comment || !canViewTicket(user, comment.ticket)) return res.status(404).json({ error: "Not found" });
    if (comment.authorUserId !== user.id && !user.isAdmin) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }
    await prisma.$transaction(async (tx) => {
      await tx.debugCaptureTicketComment.delete({ where: { id: comment.id } });
      await logDebugTicket(tx, comment.ticketId, actorOf(user), [
        {
          action: "COMMENT_DELETED",
          field: comment.authorUserId === user.id ? undefined : comment.authorEmail,
          oldValue: commentLogPreview(comment.body, commentAttachments(comment.attachments).length),
        },
      ]);
    });
    res.json({ data: { id: comment.id } });
  } catch (error) {
    console.error("debug portal comment delete error:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

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
    if (await lockedForUser(req.portalUser!, row.sprintId)) return res.status(403).json({ error: LOCKED_SPRINT_ERROR });

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
    if (await lockedForUser(req.portalUser!, row.sprintId)) return res.status(403).json({ error: LOCKED_SPRINT_ERROR });

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
    if (await lockedForUser(user, row.sprintId)) return res.status(403).json({ error: LOCKED_SPRINT_ERROR });
    if (body.status !== undefined && body.status !== row.status && !(await isDebugTicketStatus(body.status))) {
      return res.status(400).json({ error: "Unknown status" });
    }
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
      if (row.reporterUserId !== user.id) {
        return res.status(403).json({ error: ONLY_CREATOR_ERROR });
      }
      data[field] = value as never;
      entries.push({ action: "UPDATED", field, oldValue: String(row[field] ?? ""), newValue: String(value) });
    }

    if (body.sprintId !== undefined && body.sprintId !== row.sprintId) {
      if (!user.isAdmin) return res.status(403).json({ error: "Only admins can change a ticket's sprint" });
      const [fromSprint, toSprint] = await Promise.all([
        row.sprintId ? prisma.debugSprint.findUnique({ where: { id: row.sprintId }, select: { name: true } }) : null,
        body.sprintId ? prisma.debugSprint.findUnique({ where: { id: body.sprintId }, select: { name: true } }) : null,
      ]);
      if (body.sprintId && !toSprint) return res.status(400).json({ error: "Sprint not found" });
      data.sprint = body.sprintId ? { connect: { id: body.sprintId } } : { disconnect: true };
      entries.push({
        action: "UPDATED",
        field: "sprint",
        oldValue: fromSprint?.name ?? "Backlog",
        newValue: toSprint?.name ?? "Backlog",
      });
    }

    if (entries.length) {
      await prisma.$transaction(async (tx) => {
        await tx.debugCaptureTicket.update({ where: { id: row.id }, data });
        await logDebugTicket(tx, row.id, actorOf(user), entries);
      });
      if (data.status) {
        notifyAsync("debug_ticket.status.changed", {
          ticketId: row.id,
          oldStatus: row.status,
          newStatus: String(data.status),
          actorEmail: user.email,
        });
      }
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

/** Only the ticket's creator can delete it (not while its sprint is completed). Logs and comments cascade. */
router.delete("/:id", async (req: PortalRequest, res) => {
  try {
    const user = req.portalUser!;
    const row = await prisma.debugCaptureTicket.findUnique({
      where: { id: req.params.id },
      select: { id: true, ticketId: true, reporterUserId: true, sprintId: true },
    });
    if (!row || !canViewTicket(user, row)) return res.status(404).json({ error: "Not found" });
    if (row.reporterUserId !== user.id) return res.status(403).json({ error: ONLY_CREATOR_ERROR });
    if (await lockedForUser(user, row.sprintId)) return res.status(403).json({ error: LOCKED_SPRINT_ERROR });
    await prisma.debugCaptureTicket.delete({ where: { id: row.id } });
    res.json({ data: { id: row.id, ticketId: row.ticketId } });
  } catch (error) {
    console.error("debug portal delete error:", error);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

export { router as debugPortalTicketRoutes };
