import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import {
  buildAgentIssueBriefMarkdown,
  ticketOrigin,
  type AgentExportTicket,
} from "../lib/debug-agent-brief.js";
import {
  resolveAgentScreenshotUrls,
  screenshotPathsFromTicket,
  screenshotUrlFromTicket,
} from "../lib/debug-media-url.js";
import { ticketScreenshotUrls } from "../lib/debug-portal-user.js";
import { AI_AGENT_ACTOR, commentLogPreview, logDebugTicket } from "../lib/debug-ticket-log.js";
import { notifyAsync } from "../lib/notifications/index.js";
import { isDebugTicketStatus, listDebugTicketStatuses } from "../lib/debug-ticket-statuses.js";
import type { Prisma } from "@techbubble/database";

const router: IRouter = Router();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  includeFullPayload: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => v === "true" || v === "1"),
  format: z.enum(["json", "markdown"]).optional(),
  /** Omitted or "active" = the active sprint; "all" = every open sprint + backlog; "none" = backlog; else a sprint id. */
  sprintId: z.string().trim().min(1).optional(),
});

const SPRINT_SELECT = { id: true, name: true, status: true, startDate: true, endDate: true } as const;

type SprintRef = { id: string; name: string; status: string; startDate: Date | null; endDate: Date | null };

function serializeSprint(sprint: SprintRef | null | undefined) {
  if (!sprint) return null;
  return {
    id: sprint.id,
    name: sprint.name,
    status: sprint.status,
    startDate: sprint.startDate?.toISOString() ?? null,
    endDate: sprint.endDate?.toISOString() ?? null,
  };
}

type SprintScope =
  | { kind: "sprint"; sprint: SprintRef }
  | { kind: "backlog" }
  | { kind: "all" };

/** Resolve ?sprintId: default is the active sprint (falls back to every open ticket when none is active). */
async function resolveSprintScope(sprintId: string | undefined): Promise<SprintScope | null> {
  if (sprintId === "all") return { kind: "all" };
  if (sprintId === "none" || sprintId === "backlog") return { kind: "backlog" };
  if (!sprintId || sprintId === "active") {
    const active = await prisma.debugSprint.findFirst({
      where: { status: "ACTIVE" },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      select: SPRINT_SELECT,
    });
    return active ? { kind: "sprint", sprint: active } : { kind: "all" };
  }
  const sprint = await prisma.debugSprint.findUnique({ where: { id: sprintId }, select: SPRINT_SELECT });
  return sprint ? { kind: "sprint", sprint } : null;
}

/** Tickets in a completed sprint are locked; "all" leaves them out so agents only see workable tickets. */
function sprintWhere(scope: SprintScope): Prisma.DebugCaptureTicketWhereInput {
  if (scope.kind === "sprint") return { sprintId: scope.sprint.id };
  if (scope.kind === "backlog") return { sprintId: null };
  return { OR: [{ sprintId: null }, { sprint: { status: { not: "COMPLETED" } } }] };
}

/** Any configured board status key (PENDING, IN_PROGRESS, FOR_REVIEW, COMPLETED, or a custom one). */
const ticketStatusSchema = z.string().trim().min(1).max(60);

const patchStatusBodySchema = z.object({
  status: ticketStatusSchema,
});

async function findTicketByIdOrTicketId(idOrTicketId: string) {
  const trimmed = idOrTicketId.trim();
  if (!trimmed) return null;
  const include = { sprint: { select: SPRINT_SELECT } } as const;
  const byId = await prisma.debugCaptureTicket.findUnique({ where: { id: trimmed }, include });
  if (byId) return byId;
  return prisma.debugCaptureTicket.findUnique({ where: { ticketId: trimmed }, include });
}

type DbRow = {
  id: string;
  ticketId: string;
  type: string;
  status: string;
  reportedEnvironment: string;
  title: string | null;
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
  sprint?: SprintRef | null;
};

function toAgentExportTicket(row: DbRow): AgentExportTicket {
  return {
    sprintName: row.sprint?.name ?? null,
    ticketId: row.ticketId,
    type: row.type,
    status: row.status,
    reportedEnvironment: row.reportedEnvironment,
    title: row.title,
    userDescription: row.userDescription,
    reporterEmail: row.reporterEmail,
    reporterRole: row.reporterRole,
    currentUrl: row.currentUrl,
    userAgent: row.userAgent,
    screenshotUrl: row.screenshotUrl,
    elementDiagnostics: row.elementDiagnostics,
    apiPrerequisite: row.apiPrerequisite,
    fullPayload: row.fullPayload,
    createdAt: row.createdAt.toISOString(),
  };
}

function elementBlock(diagnostics: unknown) {
  const el = (diagnostics ?? {}) as Record<string, unknown>;
  const rect = el.boundingRect as Record<string, number> | undefined;
  return {
    captureScope: typeof el.captureScope === "string" ? el.captureScope : null,
    tagName: typeof el.tagName === "string" ? el.tagName : null,
    elementId: typeof el.id === "string" ? el.id : null,
    className: typeof el.className === "string" ? el.className : null,
    cssSelector: typeof el.cssSelector === "string" ? el.cssSelector : null,
    innerText: typeof el.innerText === "string" ? el.innerText : null,
    boundingRect:
      rect &&
      typeof rect.top === "number" &&
      typeof rect.left === "number" &&
      typeof rect.width === "number" &&
      typeof rect.height === "number"
        ? {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }
        : null,
  };
}

function apiContextBlock(apiPrerequisite: unknown) {
  if (!apiPrerequisite || typeof apiPrerequisite !== "object" || Array.isArray(apiPrerequisite)) {
    return null;
  }
  const api = apiPrerequisite as Record<string, unknown>;
  if (typeof api.endpoint !== "string" || !api.endpoint.trim()) return null;
  return {
    method: typeof api.method === "string" ? api.method : "GET",
    endpoint: api.endpoint,
    httpStatus: typeof api.status === "number" ? api.status : null,
    latencyMs: typeof api.latencyMs === "number" ? api.latencyMs : null,
    captureSource: typeof api.captureSource === "string" ? api.captureSource : null,
    payloadCaptured: api.payloadCaptured ?? null,
  };
}

function serializeForAgent(row: DbRow, includeFullPayload: boolean) {
  const exportTicket = toAgentExportTicket(row);
  const shotUrls = screenshotPathsFromTicket(row);
  const publicScreenshotUrl = shotUrls.publicUrl ?? screenshotUrlFromTicket(row);

  const portalBase = process.env.DEBUG_PORTAL_PUBLIC_URL?.replace(/\/$/, "");

  const screenshotNote = !shotUrls.relativePath
    ? "No image attached to this ticket."
    : publicScreenshotUrl
      ? "Fetch screenshot.publicUrl (HTTPS). publicUrl prefers the API /uploads host; portalUrl uses debug-web when its /uploads proxy is deployed."
      : "Screenshot path is stored but no public base URL is configured. Set DEBUG_PORTAL_PUBLIC_URL and/or API_PUBLIC_URL on the API service.";

  return {
    id: row.id,
    ticketId: row.ticketId,
    status: row.status,
    type: row.type,
    reportedEnvironment: row.reportedEnvironment,
    createdAt: row.createdAt.toISOString(),
    sprint: serializeSprint(row.sprint),
    locked: row.sprint?.status === "COMPLETED",
    origin: ticketOrigin(row.fullPayload),
    title: row.title,
    summary: row.userDescription.trim().slice(0, 280),
    userDescription: row.userDescription,
    pageUrl: row.currentUrl,
    userAgent: row.userAgent,
    reporter: {
      userId: row.reporterUserId,
      email: row.reporterEmail,
      role: row.reporterRole,
    },
    element: elementBlock(row.elementDiagnostics),
    apiContext: apiContextBlock(row.apiPrerequisite),
    screenshot: {
      available: Boolean(shotUrls.relativePath && publicScreenshotUrl),
      relativePath: shotUrls.relativePath,
      publicUrl: publicScreenshotUrl,
      portalUrl: shotUrls.portalUrl,
      apiUrl: shotUrls.apiUrl,
      note: screenshotNote,
    },
    screenshots: ticketScreenshotUrls(row).map((url) => resolveAgentScreenshotUrls(url)),
    agentBriefMarkdown: buildAgentIssueBriefMarkdown(exportTicket),
    links: portalBase ? { debugPortalDetail: `${portalBase}/tickets/${row.id}` } : undefined,
    ...(includeFullPayload ? { fullPayload: row.fullPayload } : {}),
  };
}

const AGENT_INSTRUCTIONS =
  "Each ticket includes structured fields plus agentBriefMarkdown. Use pageUrl, element.cssSelector, apiContext, and screenshot.publicUrl together. Work in the techbubble-website monorepo with minimal, pattern-matching fixes. When a fix is done, PATCH /api/debug-portal/agent/tickets/:ticketId/status with { \"status\": \"FOR_REVIEW\" }. Tickets in a completed sprint are locked.";

function scopeLabel(scope: SprintScope): string {
  if (scope.kind === "sprint") return scope.sprint.name;
  if (scope.kind === "backlog") return "Backlog";
  return "All open sprints and backlog";
}

/**
 * GET /api/debug-portal/agent/tickets/in-progress?limit=20&sprintId=active
 * Lists IN_PROGRESS tickets for coding agents (JSON or markdown), scoped to the active sprint by default.
 * sprintId: omitted/"active" (active sprint, else all open), "all", "none" (backlog), or a sprint id.
 */
router.get("/tickets/in-progress", async (req, res) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const limit = query.limit ?? 50;
    const includeFullPayload = query.includeFullPayload ?? false;
    const format = query.format ?? "json";

    const scope = await resolveSprintScope(query.sprintId);
    if (!scope) {
      return res.status(404).json({ error: "Sprint not found", code: "SPRINT_NOT_FOUND" });
    }

    const where: Prisma.DebugCaptureTicketWhereInput = { status: "IN_PROGRESS", ...sprintWhere(scope) };
    const [rows, total] = await Promise.all([
      prisma.debugCaptureTicket.findMany({
        where,
        orderBy: { createdAt: "asc" },
        take: limit,
        include: { sprint: { select: SPRINT_SELECT } },
      }),
      prisma.debugCaptureTicket.count({ where }),
    ]);

    const tickets = rows.map((row) => serializeForAgent(row as DbRow, includeFullPayload));
    const combinedAgentBriefMarkdown = tickets
      .map((t) => t.agentBriefMarkdown)
      .join("\n\n---\n\n");
    const label = scopeLabel(scope);

    if (format === "markdown") {
      res.type("text/markdown; charset=utf-8");
      if (tickets.length === 0) {
        return res.send(`# In-progress debug tickets: ${label}\n\nNo tickets with status IN_PROGRESS.\n`);
      }
      return res.send(
        `# In-progress debug tickets: ${label} (${tickets.length} of ${total})\n\n${AGENT_INSTRUCTIONS}\n\n${combinedAgentBriefMarkdown}\n`,
      );
    }

    res.json({
      schemaVersion: "1.1",
      generatedAt: new Date().toISOString(),
      repository: "techbubble-website",
      statusFilter: "IN_PROGRESS",
      sprintFilter: {
        scope: scope.kind,
        label,
        sprint: scope.kind === "sprint" ? serializeSprint(scope.sprint) : null,
      },
      instructions: AGENT_INSTRUCTIONS,
      count: tickets.length,
      total,
      limit,
      combinedAgentBriefMarkdown,
      tickets,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query parameters", details: error.errors });
    }
    console.error("debug portal agent list error:", error);
    res.status(500).json({ error: "Failed to list in-progress tickets for agent" });
  }
});

/**
 * PATCH /api/debug-portal/agent/tickets/:idOrTicketId/status
 * Body: { "status": "PENDING" | "IN_PROGRESS" | "FOR_REVIEW" | "COMPLETED" | <custom status key> }
 * :idOrTicketId may be the internal id (cuid) or public ticketId (e.g. TICK-1793584247027).
 */
router.patch("/tickets/:idOrTicketId/status", async (req, res) => {
  try {
    const { status } = patchStatusBodySchema.parse(req.body);
    if (!(await isDebugTicketStatus(status))) {
      const allowed = (await listDebugTicketStatuses()).map((s) => s.key);
      return res.status(400).json({ error: "Unknown status", code: "UNKNOWN_STATUS", allowedStatuses: allowed });
    }
    const existing = await findTicketByIdOrTicketId(req.params.idOrTicketId!);
    if (!existing) {
      return res.status(404).json({ error: "Ticket not found", code: "TICKET_NOT_FOUND" });
    }
    const sprint = serializeSprint(existing.sprint);
    if (existing.sprint?.status === "COMPLETED") {
      return res.status(409).json({
        error: `Ticket ${existing.ticketId} is in completed sprint "${existing.sprint.name}" and is locked.`,
        code: "SPRINT_LOCKED",
        ticket: { id: existing.id, ticketId: existing.ticketId, status: existing.status, sprint },
      });
    }

    const previousStatus = existing.status;
    if (previousStatus === status) {
      return res.json({
        schemaVersion: "1.1",
        updated: false,
        message: "Status unchanged",
        ticket: {
          id: existing.id,
          ticketId: existing.ticketId,
          status: existing.status,
          previousStatus,
          sprint,
        },
      });
    }

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.debugCaptureTicket.update({
        where: { id: existing.id },
        data: { status },
      });
      await logDebugTicket(tx, existing.id, AI_AGENT_ACTOR, [
        { action: "STATUS_CHANGED", field: "status", oldValue: previousStatus, newValue: status },
      ]);
      return updated;
    });
    notifyAsync("debug_ticket.status.changed", {
      ticketId: existing.id,
      oldStatus: previousStatus,
      newStatus: status,
      actorEmail: AI_AGENT_ACTOR.email,
    });

    res.json({
      schemaVersion: "1.1",
      updated: true,
      ticket: {
        id: row.id,
        ticketId: row.ticketId,
        status: row.status,
        previousStatus,
        sprint,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal agent patch status error:", error);
    res.status(500).json({ error: "Failed to update ticket status" });
  }
});

const agentCommentSchema = z.object({ body: z.string().trim().min(1).max(5000) });

/**
 * POST /api/debug-portal/agent/tickets/:idOrTicketId/comments
 * Body: { "body": "..." }. Header `X-Forwarded-User: <email>` names the author, who must be an
 * active TIBOSX user. Development only, like the rest of the agent API, so no sign-in token is needed.
 */
router.post("/tickets/:idOrTicketId/comments", async (req, res) => {
  try {
    const { body } = agentCommentSchema.parse(req.body);
    const headerValue = req.get("x-forwarded-user") ?? req.get("x-forwarded-email") ?? "";
    const email = headerValue.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        error: "Send the author's email in the X-Forwarded-User header",
        code: "AUTHOR_REQUIRED",
      });
    }
    const author = await prisma.adminUser.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, active: true },
      select: { id: true, email: true, name: true },
    });
    if (!author) {
      return res.status(400).json({
        error: `No active TIBOSX user with email ${email}`,
        code: "AUTHOR_NOT_FOUND",
      });
    }
    const ticket = await findTicketByIdOrTicketId(req.params.idOrTicketId!);
    if (!ticket) return res.status(404).json({ error: "Ticket not found", code: "TICKET_NOT_FOUND" });

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.debugCaptureTicketComment.create({
        data: {
          ticketId: ticket.id,
          authorUserId: author.id,
          authorEmail: author.email,
          authorName: author.name || null,
          body,
          attachments: [],
        },
      });
      await logDebugTicket(tx, ticket.id, { userId: author.id, email: author.email }, [
        { action: "COMMENT_ADDED", newValue: commentLogPreview(body, 0) },
      ]);
      return created;
    });

    res.status(201).json({
      schemaVersion: "1.1",
      comment: {
        id: comment.id,
        ticketId: ticket.ticketId,
        authorEmail: comment.authorEmail,
        authorName: comment.authorName,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("debug portal agent comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

export { router as debugPortalAgentRoutes };
