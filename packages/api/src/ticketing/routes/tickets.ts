import { Router, type IRouter } from "express";
import multer from "multer";
import { z } from "zod";
import {
  TicketPriority,
  TicketStatus,
  TicketType,
  prisma,
} from "@techbubble/database";
import { authMiddleware, type TicketingRequest } from "../middleware/auth.js";
import { logTicketAudit } from "../lib/ticket-audit.js";
import { nextTicketNumber } from "../lib/ticket-number.js";
import {
  canAccessTicketOrganization,
  canSelectOrganizationForNewTicket,
  ticketOrganizationFilter,
} from "../lib/ticket-access.js";
import { saveTicketUpload } from "../lib/upload-storage.js";
import { streamTicketAttachmentFile } from "../lib/serve-ticket-attachment.js";
import {
  canPerformLifecycleAction,
  nextStatusForLifecycleAction,
  resolveTicketLifecycleActor,
  type TicketLifecycleAction,
} from "../lib/ticket-lifecycle.js";
import type { WorkspaceRequest } from "../middleware/tbos-workspace.js";
import { autoCloseStaleResolvedTickets } from "../lib/auto-close-resolved-tickets.js";
import { notifyAsync } from "../../lib/notifications";
import { serializeTicketRow, ticketDetailIncludes } from "../lib/serialize-ticket.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const lifecycleSchema = z.object({
  action: z.enum(["reopen", "start_work", "client_info_needed", "resolve", "close", "cancel"]),
  resolutionNotes: z.string().max(20000).optional(),
});

function serializeAuditLog(row: {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: unknown;
  createdAt: Date;
  actor?: { id: string; name: string } | null;
}) {
  return {
    id: row.id,
    action: row.action,
    field: row.field,
    oldValue: row.oldValue,
    newValue: row.newValue,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
    actor: row.actor,
  };
}

function auditVisibleToClient(log: { action: string; metadata: unknown }): boolean {
  if (log.action !== "MESSAGE_ADDED") return true;
  const meta = log.metadata;
  if (meta && typeof meta === "object" && "isInternal" in meta) {
    return !Boolean((meta as { isInternal?: boolean }).isInternal);
  }
  return true;
}

const router: IRouter = Router();

router.use(authMiddleware);

const ticketCreateSchema = z.object({
  type: z.nativeEnum(TicketType),
  priority: z.nativeEnum(TicketPriority).optional(),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(20000),
  organizationId: z.string().optional(),
});

const ticketUpdateSchema = z.object({
  type: z.nativeEnum(TicketType).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  subject: z.string().min(1).max(300).optional(),
  description: z.string().min(1).max(20000).optional(),
  assignedToId: z.string().nullable().optional(),
  resolutionNotes: z.string().max(20000).optional().nullable(),
});

const messageSchema = z.object({
  body: z.string().min(1).max(20000),
  isInternal: z.boolean().optional(),
});


const serializeTicket = serializeTicketRow;

router.get("/activity/recent", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const orgFilter = await ticketOrganizationFilter(user);
  if (orgFilter === "deny") return res.json({ data: [] });

  const tickets = await prisma.ticket.findMany({
    where: orgFilter,
    select: { id: true, ticketNumber: true, subject: true },
    take: 50,
  });
  const ticketIds = tickets.map((t) => t.id);
  if (!ticketIds.length) return res.json({ data: [] });

  const logs = await prisma.ticketAuditLog.findMany({
    where: { ticketId: { in: ticketIds } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      ticket: { select: { id: true, ticketNumber: true, subject: true } },
      actor: { select: { name: true, email: true } },
    },
  });

  const { latestActivityPerTicket, serializeTicketActivityRow } = await import(
    "../lib/recent-ticket-activity.js"
  );

  res.json({
    data: latestActivityPerTicket(logs, 4).map(serializeTicketActivityRow),
  });
});

router.get("/", async (req: TicketingRequest, res) => {
  await autoCloseStaleResolvedTickets();
  const user = req.ticketingUser!;
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const organizationId = typeof req.query.organizationId === "string" ? req.query.organizationId : "";
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const orgFilter = await ticketOrganizationFilter(user);
  if (orgFilter === "deny") return res.status(403).json({ error: "Access denied" });

  const where: {
    organizationId?: string | { in: string[] };
    status?: TicketStatus;
    OR?: Array<{ subject?: { contains: string; mode: "insensitive" }; ticketNumber?: { contains: string; mode: "insensitive" } }>;
  } = { ...orgFilter };

  if (organizationId) {
    if (orgFilter.organizationId && typeof orgFilter.organizationId === "object") {
      if (!orgFilter.organizationId.in.includes(organizationId)) {
        return res.json({ data: [] });
      }
    }
    where.organizationId = organizationId;
  }

  if (status && Object.values(TicketStatus).includes(status as TicketStatus)) {
    where.status = status as TicketStatus;
  }

  if (q.length >= 2) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { ticketNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.ticket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: ticketDetailIncludes,
  });

  const { enrichTicketsUpdatedBy } = await import("../lib/ticket-list-updated-by.js");
  const { enrichTicketsProjectLabels } = await import("../lib/ticket-project-label.js");
  const enriched = await enrichTicketsUpdatedBy(rows);
  const withProjects = await enrichTicketsProjectLabels(enriched);
  res.json({ data: withProjects.map(serializeTicket) });
});

router.post("/", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const parsed = ticketCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error", details: parsed.error.errors });

  let organizationId = parsed.data.organizationId;
  if (user.role === "CLIENT") {
    if (!user.organizationId) return res.status(403).json({ error: "No organization linked" });
    organizationId = organizationId ?? user.organizationId;
  } else {
    if (!organizationId) return res.status(400).json({ error: "organizationId is required for consultants" });
  }

  if (!(await canSelectOrganizationForNewTicket(user, organizationId))) {
    return res.status(400).json({ error: "Invalid organization" });
  }

  const org = await prisma.organization.findFirst({
    where: { id: organizationId, active: true },
    select: { id: true, projectId: true },
  });
  if (!org) return res.status(400).json({ error: "Invalid organization" });

  const ticketNumber = await nextTicketNumber();
  const projectId = org.projectId ?? null;
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      organizationId: org.id,
      projectId,
      type: parsed.data.type,
      priority: parsed.data.priority ?? TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      subject: String(parsed.data.subject).trim(),
      description: String(parsed.data.description).trim(),
      createdById: user.id,
      updatedById: user.id,
    },
    include: ticketDetailIncludes,
  });

  await logTicketAudit(ticket.id, user.id, "CREATED", {
    metadata: { type: ticket.type, priority: ticket.priority },
  });

  if (projectId) {
    const { notifySupportGroupOfTicket } = await import("../../lib/support-project.js");
    const { autoAssignTicketToProjectSupport } = await import("../../lib/ticket-project-assignees.js");
    await autoAssignTicketToProjectSupport(ticket.id, projectId);
    void notifySupportGroupOfTicket(ticket.id);
    const refreshed = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: ticketDetailIncludes,
    });
    if (refreshed) {
      return res.status(201).json({ data: serializeTicket(refreshed) });
    }
  }

  res.status(201).json({ data: serializeTicket(ticket) });
});

router.get("/:id/attachments/:attachmentId/file", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const attachment = await prisma.ticketAttachment.findFirst({
    where: { id: req.params.attachmentId, ticketId: ticket.id },
  });
  if (!attachment) return res.status(404).json({ error: "Attachment not found" });

  const download = req.query.download === "1" || req.query.download === "true";
  await streamTicketAttachmentFile(attachment, res, { download });
});

router.get("/assignees", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const staffTbosRole = (user.tbosRole ?? "").toLowerCase();
  const mayListAssignees =
    (user.role === "CONSULTANT" && (user.consultantVerified || Boolean(user.tbosAdminUserId))) ||
    staffTbosRole === "customer_support" ||
    staffTbosRole === "admin" ||
    staffTbosRole === "project_manager" ||
    staffTbosRole === "project_member";
  if (!mayListAssignees) {
    return res.json({ data: [] });
  }
  const ticketId = typeof req.query.ticketId === "string" ? req.query.ticketId : "";
  if (!ticketId) return res.status(400).json({ error: "ticketId is required" });
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { organizationId: true, projectId: true },
  });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }
  const org = await prisma.organization.findUnique({
    where: { id: ticket.organizationId },
    select: { projectId: true },
  });
  const projectId = ticket.projectId ?? org?.projectId ?? null;
  const { listProjectTicketAssignees } = await import("../../lib/ticket-project-assignees.js");
  const rows = await listProjectTicketAssignees(projectId);
  res.json({ data: rows });
});

router.get("/:id", async (req: TicketingRequest, res) => {
  await autoCloseStaleResolvedTickets();
  const user = req.ticketingUser!;
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: {
      ...ticketDetailIncludes,
      attachments: { orderBy: { createdAt: "asc" } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { id: true, name: true } } } },
    },
  });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const messages = await prisma.ticketMessage.findMany({
    where: {
      ticketId: ticket.id,
      ...(user.role === "CLIENT" ? { isInternal: false } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true, role: true } } },
  });

  const auditLogs = ticket.auditLogs
    .filter((log) => (user.role === "CLIENT" ? auditVisibleToClient(log) : true))
    .map(serializeAuditLog);

  const { enrichTicketsProjectLabels } = await import("../lib/ticket-project-label.js");
  const [withProject] = await enrichTicketsProjectLabels([ticket]);

  res.json({
    data: {
      ...serializeTicket(withProject ?? ticket),
      attachments: ticket.attachments,
      messages,
      auditLogs,
    },
  });
});

router.post("/:id/lifecycle", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const parsed = lifecycleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error" });

  const existing = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!existing || !(await canAccessTicketOrganization(user, existing.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const tbosUser = (req as WorkspaceRequest).user;
  const { role, isCreator } = await resolveTicketLifecycleActor({
    ticketingUser: user,
    ticketCreatedById: existing.createdById,
    impersonatorId: tbosUser?.impersonatorId,
  });
  const action = parsed.data.action as TicketLifecycleAction;
  if (!canPerformLifecycleAction(role, action, { isCreator })) {
    return res.status(403).json({ error: "Not allowed to perform this action" });
  }

  const nextStatus = nextStatusForLifecycleAction(existing.status, action);
  if (!nextStatus) {
    return res.status(400).json({ error: "Invalid status transition" });
  }

  if (action === "resolve") {
    const notes = parsed.data.resolutionNotes?.trim() ?? "";
    if (!notes) {
      return res.status(400).json({
        error: "Resolution notes are mandatory before the ticket is resolved",
      });
    }
  }

  const data: Record<string, unknown> = { status: nextStatus };
  if (action === "resolve" && parsed.data.resolutionNotes?.trim()) {
    data.resolutionNotes = parsed.data.resolutionNotes.trim();
  }
  if (nextStatus === TicketStatus.CLOSED || nextStatus === TicketStatus.RESOLVED) {
    data.closedAt = new Date();
  } else if (nextStatus !== TicketStatus.CANCELLED) {
    data.closedAt = null;
  }

  const updated = await prisma.ticket.update({
    where: { id: existing.id },
    data: { ...data, updatedById: user.id },
    include: ticketDetailIncludes,
  });

  await logTicketAudit(existing.id, user.id, "UPDATED", {
    field: "status",
    oldValue: existing.status,
    newValue: nextStatus,
    metadata: { lifecycleAction: action },
  });

  const actor = await prisma.ticketingUser.findUnique({
    where: { id: user.id },
    select: { email: true },
  });
  notifyAsync("ticket.status.changed", {
    ticketId: existing.id,
    oldStatus: existing.status,
    newStatus: nextStatus,
    actorEmail: actor?.email,
  });

  res.json({ data: serializeTicket(updated) });
});

router.patch("/:id", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const parsed = ticketUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error", details: parsed.error.errors });

  const existing = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!existing || !(await canAccessTicketOrganization(user, existing.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  if (parsed.data.status !== undefined) {
    return res.status(400).json({ error: "Use lifecycle actions to change status" });
  }

  if (existing.status === TicketStatus.CLOSED || existing.status === TicketStatus.CANCELLED) {
    return res.status(400).json({ error: "Cannot edit a closed or cancelled ticket" });
  }

  const isConsultant =
    user.role === "CONSULTANT" && (user.consultantVerified || Boolean(user.tbosAdminUserId));
  if (!isConsultant) {
    const allowed = Object.keys(parsed.data).every(
      (k) => k === "description" || k === "type" || k === "priority" || k === "subject",
    );
    if (!allowed || parsed.data.assignedToId !== undefined || parsed.data.resolutionNotes !== undefined) {
      return res.status(403).json({ error: "Clients can only update description, type, priority, and subject" });
    }
  }

  if (parsed.data.assignedToId !== undefined) {
    const org = await prisma.organization.findUnique({
      where: { id: existing.organizationId },
      select: { projectId: true },
    });
    const projectId = existing.projectId ?? org?.projectId ?? null;
    const { isValidProjectTicketAssignee } = await import("../../lib/ticket-project-assignees.js");
    const ok = await isValidProjectTicketAssignee(projectId, parsed.data.assignedToId, user.id);
    if (!ok) {
      return res.status(400).json({ error: "Assignee must be a member of the project support team" });
    }
  }

  const data: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    data[field] = value;
  }

  const updated = await prisma.ticket.update({
    where: { id: existing.id },
    data: { ...data, updatedById: user.id },
    include: ticketDetailIncludes,
  });

  for (const field of ["priority", "type", "assignedToId", "subject", "description"] as const) {
    const next = parsed.data[field];
    if (next === undefined) continue;
    const prev = existing[field];
    if (String(prev) !== String(next)) {
      await logTicketAudit(existing.id, user.id, "UPDATED", {
        field,
        oldValue: String(prev ?? ""),
        newValue: String(next ?? ""),
      });
    }
  }

  res.json({ data: serializeTicket(updated) });
});

router.post("/:id/messages", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error" });

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.CANCELLED) {
    return res.status(400).json({ error: "Cannot add messages to a closed or cancelled ticket" });
  }

  const isConsultant = user.role === "CONSULTANT" && user.consultantVerified;
  if (parsed.data.isInternal && !isConsultant) {
    return res.status(403).json({ error: "Internal notes are consultant-only" });
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: user.id,
      body: parsed.data.body.trim(),
      isInternal: Boolean(parsed.data.isInternal) && isConsultant,
    },
    include: { author: { select: { id: true, name: true, email: true, role: true } } },
  });

  const statusPatch: { status?: TicketStatus } = {};
  if (
    user.role === "CLIENT" &&
    ticket.status === TicketStatus.PENDING_CLIENT &&
    !message.isInternal
  ) {
    statusPatch.status = TicketStatus.IN_PROGRESS;
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { updatedAt: new Date(), updatedById: user.id, ...statusPatch },
  });

  if (statusPatch.status) {
    await logTicketAudit(ticket.id, user.id, "UPDATED", {
      field: "status",
      oldValue: ticket.status,
      newValue: statusPatch.status,
      metadata: { reason: "client_replied" },
    });
    notifyAsync("ticket.status.changed", {
      ticketId: ticket.id,
      oldStatus: ticket.status,
      newStatus: statusPatch.status,
      actorEmail: message.author.email,
    });
  }

  await logTicketAudit(ticket.id, user.id, "MESSAGE_ADDED", {
    metadata: { messageId: message.id, isInternal: message.isInternal },
  });

  if (!message.isInternal) {
    notifyAsync("ticket.message", { ticketId: ticket.id, messageId: message.id });
  }

  res.status(201).json({ data: message });
});

router.post("/:id/attachments/upload", upload.single("file"), async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.CANCELLED) {
    return res.status(400).json({ error: "Cannot upload files to a closed or cancelled ticket" });
  }

  try {
    const stored = await saveTicketUpload(req.file);
    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId: ticket.id,
        fileName: stored.fileName,
        fileUrl: stored.fileUrl,
        storageKey: stored.storageKey,
        fileSize: stored.fileSize,
        uploadedById: user.id,
      },
    });
    await logTicketAudit(ticket.id, user.id, "ATTACHMENT_ADDED", {
      metadata: { fileName: attachment.fileName },
    });
    res.status(201).json({ data: attachment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    res.status(400).json({ error: message });
  }
});

router.post("/:id/attachments", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const body = z
    .object({
      fileName: z.string().min(1),
      fileUrl: z.string().url(),
      fileSize: z.number().int().positive().optional(),
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Validation error" });

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const attachment = await prisma.ticketAttachment.create({
    data: {
      ticketId: ticket.id,
      fileName: body.data.fileName,
      fileUrl: body.data.fileUrl,
      fileSize: body.data.fileSize,
      uploadedById: user.id,
    },
  });

  await logTicketAudit(ticket.id, user.id, "ATTACHMENT_ADDED", {
    metadata: { fileName: attachment.fileName },
  });

  res.status(201).json({ data: attachment });
});

export { router as ticketRoutes };
