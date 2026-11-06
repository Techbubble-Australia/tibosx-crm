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
import { AI_AGENT_ACTOR, logDebugTicket } from "../lib/debug-ticket-log.js";
import { isDebugTicketStatus } from "../lib/debug-ticket-statuses.js";

const router: IRouter = Router();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  includeFullPayload: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => v === "true" || v === "1"),
  format: z.enum(["json", "markdown"]).optional(),
});

/** Any configured board status key (PENDING, IN_PROGRESS, FOR_REVIEW, COMPLETED, or a custom one). */
const ticketStatusSchema = z.string().trim().min(1).max(60);

const patchStatusBodySchema = z.object({
  status: ticketStatusSchema,
});

async function findTicketByIdOrTicketId(idOrTicketId: string) {
  const trimmed = idOrTicketId.trim();
  if (!trimmed) return null;
  const byId = await prisma.debugCaptureTicket.findUnique({ where: { id: trimmed } });
  if (byId) return byId;
  return prisma.debugCaptureTicket.findUnique({ where: { ticketId: trimmed } });
}

type DbRow = {
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
};

function toAgentExportTicket(row: DbRow): AgentExportTicket {
  return {
    ticketId: row.ticketId,
    type: row.type,
    status: row.status,
    reportedEnvironment: row.reportedEnvironment,
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
    origin: ticketOrigin(row.fullPayload),
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
  "Each ticket includes structured fields plus agentBriefMarkdown. Use pageUrl, element.cssSelector, apiContext, and screenshot.publicUrl together. Work in the techbubble-website monorepo with minimal, pattern-matching fixes.";

/**
 * GET /api/debug-portal/agent/tickets/in-progress
 * Lists IN_PROGRESS debug capture tickets for coding agents (JSON or markdown).
 */
router.get("/tickets/in-progress", async (req, res) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const limit = query.limit ?? 50;
    const includeFullPayload = query.includeFullPayload ?? false;
    const format = query.format ?? "json";

    const rows = await prisma.debugCaptureTicket.findMany({
      where: { status: "IN_PROGRESS" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    const tickets = rows.map((row) => serializeForAgent(row as DbRow, includeFullPayload));
    const combinedAgentBriefMarkdown = tickets
      .map((t) => t.agentBriefMarkdown)
      .join("\n\n---\n\n");

    if (format === "markdown") {
      res.type("text/markdown; charset=utf-8");
      if (tickets.length === 0) {
        return res.send("# In-progress debug tickets\n\nNo tickets with status IN_PROGRESS.\n");
      }
      return res.send(
        `# In-progress debug tickets (${tickets.length})\n\n${AGENT_INSTRUCTIONS}\n\n${combinedAgentBriefMarkdown}\n`,
      );
    }

    res.json({
      schemaVersion: "1.0",
      generatedAt: new Date().toISOString(),
      repository: "techbubble-website",
      statusFilter: "IN_PROGRESS",
      instructions: AGENT_INSTRUCTIONS,
      count: tickets.length,
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
      return res.status(400).json({ error: "Unknown status", code: "UNKNOWN_STATUS" });
    }
    const existing = await findTicketByIdOrTicketId(req.params.idOrTicketId);
    if (!existing) {
      return res.status(404).json({ error: "Ticket not found", code: "TICKET_NOT_FOUND" });
    }

    const previousStatus = existing.status;
    if (previousStatus === status) {
      return res.json({
        schemaVersion: "1.0",
        updated: false,
        message: "Status unchanged",
        ticket: {
          id: existing.id,
          ticketId: existing.ticketId,
          status: existing.status,
          previousStatus,
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

    res.json({
      schemaVersion: "1.0",
      updated: true,
      ticket: {
        id: row.id,
        ticketId: row.ticketId,
        status: row.status,
        previousStatus,
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

export { router as debugPortalAgentRoutes };
