import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth.js";
import {
  MAX_TICKET_SCREENSHOTS,
  TICKET_TITLE_MAX,
  resolveDebugPortalUser,
  screenshotFieldsFromInput,
  ticketScreenshotUrls,
} from "../lib/debug-portal-user.js";
import { logDebugTicket } from "../lib/debug-ticket-log.js";
import { activeDebugSprintId } from "../lib/debug-sprints.js";
import { notifyAsync } from "../lib/notifications/index.js";

const router: IRouter = Router();

const MAX_JSON_CHARS = 100_000;

const boundingRectSchema = z.object({
  top: z.number(),
  left: z.number(),
  width: z.number(),
  height: z.number(),
});

const elementDiagnosticsSchema = z.object({
  tagName: z.string(),
  id: z.string().nullable().optional(),
  className: z.string().nullable().optional(),
  cssSelector: z.string(),
  innerText: z.string().nullable().optional(),
  boundingRect: boundingRectSchema,
});

const apiPrerequisiteSchema = z
  .object({
    endpoint: z.string(),
    method: z.string(),
    status: z.number().nullable(),
    latencyMs: z.number(),
    payloadCaptured: z.unknown(),
  })
  .nullable()
  .optional();

const createSchema = z.object({
  ticketId: z.string().min(1).max(80),
  type: z.enum(["BUG", "ENHANCEMENT"]),
  reportedEnvironment: z.enum(["development", "staging", "production"]).default("development"),
  title: z.string().trim().min(1, "Title is required").max(TICKET_TITLE_MAX),
  userDescription: z.string().min(1).max(20_000),
  userMetadata: z.object({
    userId: z.string(),
    role: z.string(),
    userAgent: z.string(),
    currentUrl: z.string(),
  }),
  elementDiagnostics: elementDiagnosticsSchema,
  apiPrerequisite: apiPrerequisiteSchema,
  screenshotUrl: z.string().max(2000).nullable().optional(),
  screenshotUrls: z.array(z.string().trim().min(1).max(2000)).max(MAX_TICKET_SCREENSHOTS).optional(),
  fullPayload: z.record(z.string(), z.unknown()).optional(),
});

/** Saving a capture is open to every TBOS user; browsing all captures stays admin-only. */
async function requireCaptureAdmin(req: AuthRequest, res: import("express").Response): Promise<boolean> {
  const user = req.user?.id ? await resolveDebugPortalUser(req.user.id) : null;
  if (user?.isAdmin) return true;
  res.status(403).json({ error: "Forbidden: insufficient permissions" });
  return false;
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function truncateJson(value: unknown, maxChars: number): unknown {
  const raw = JSON.stringify(value ?? null);
  if (raw.length <= maxChars) return value;
  return { _truncated: true, preview: raw.slice(0, maxChars) };
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

function serializeRow(row: {
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
}) {
  const screenshotUrls = ticketScreenshotUrls(row);
  return {
    id: row.id,
    ticketId: row.ticketId,
    type: row.type,
    status: row.status,
    reportedEnvironment: row.reportedEnvironment,
    title: row.title ?? null,
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

router.post("/", async (req: AuthRequest, res) => {
  try {
    const u = req.user;
    if (!u) return res.status(401).json({ error: "Unauthorized" });

    const input = createSchema.parse(req.body);
    const screenshots = screenshotFieldsFromInput(input);
    const clientIp = clientIpFromRequest(req);

    const apiPrerequisite = input.apiPrerequisite
      ? {
          ...input.apiPrerequisite,
          payloadCaptured: truncateJson(input.apiPrerequisite.payloadCaptured, MAX_JSON_CHARS),
        }
      : null;

    const fullPayload = {
      ...(input.fullPayload ?? {}),
      ticketId: input.ticketId,
      timestamp: new Date().toISOString(),
      type: input.type,
      reportedEnvironment: input.reportedEnvironment,
      title: input.title,
      userDescription: input.userDescription,
      userMetadata: {
        ...input.userMetadata,
        clientIp,
      },
      elementDiagnostics: input.elementDiagnostics,
      apiPrerequisite,
      screenshotUrl: screenshots.screenshotUrl,
      screenshotUrls: screenshots.screenshotUrls,
    };

    const sprintId = await activeDebugSprintId();
    let ticketId = input.ticketId;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const row = await prisma.debugCaptureTicket.create({
          data: {
            ticketId,
            type: input.type,
            reportedEnvironment: input.reportedEnvironment,
            title: input.title,
            userDescription: input.userDescription,
            reporterUserId: u.id,
            reporterEmail: u.email,
            reporterRole: input.userMetadata.role,
            currentUrl: input.userMetadata.currentUrl,
            userAgent: input.userMetadata.userAgent,
            elementDiagnostics: asInputJson(input.elementDiagnostics),
            apiPrerequisite: apiPrerequisite ? asInputJson(apiPrerequisite) : undefined,
            screenshotUrl: screenshots.screenshotUrl,
            screenshotUrls: screenshots.screenshotUrls,
            fullPayload: asInputJson(fullPayload),
            sprintId,
          },
        });
        await logDebugTicket(prisma, row.id, { userId: u.id, email: u.email }, [{ action: "CREATED" }]);
        notifyAsync("debug_ticket.created", { ticketId: row.id });
        return res.status(201).json({
          data: serializeRow(row),
          clientIp,
        });
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === "P2002" && attempt < 2) {
          ticketId = `TICK-${Date.now()}-${attempt + 1}`;
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
    console.error("debug capture create error:", error);
    return res.status(500).json({ error: "Failed to save debug capture" });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    if (!(await requireCaptureAdmin(req, res))) return;
    const take = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip = Math.max(0, Number(req.query.offset) || 0);
    const [rows, total] = await Promise.all([
      prisma.debugCaptureTicket.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          ticketId: true,
          type: true,
          status: true,
          reportedEnvironment: true,
          title: true,
          userDescription: true,
          reporterUserId: true,
          reporterEmail: true,
          reporterRole: true,
          currentUrl: true,
          userAgent: true,
          elementDiagnostics: true,
          apiPrerequisite: true,
          screenshotUrl: true,
          screenshotUrls: true,
          fullPayload: true,
          createdAt: true,
        },
      }),
      prisma.debugCaptureTicket.count(),
    ]);
    res.json({
      data: rows.map(serializeRow),
      total,
    });
  } catch (error) {
    console.error("debug capture list error:", error);
    res.status(500).json({ error: "Failed to list debug captures" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    if (!(await requireCaptureAdmin(req, res))) return;
    const row = await prisma.debugCaptureTicket.findUnique({
      where: { id: req.params.id },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeRow(row) });
  } catch (error) {
    console.error("debug capture get error:", error);
    res.status(500).json({ error: "Failed to fetch debug capture" });
  }
});

export { router as debugCaptureTicketRoutes };
