import { Router, type IRouter } from "express";
import multer from "multer";
import { z } from "zod";
import { TicketPriority, TicketStatus, TicketType, prisma } from "@techbubble/database";
import { tbosAuthMiddleware, requireTbosAdmin, type TbosRequest } from "../middleware/tbos-auth.js";
import { assignedOrganizationIds } from "../lib/ticket-access.js";
import { resolveTbosActorUserId } from "../lib/tbos-actor.js";
import { logTicketAudit } from "../lib/ticket-audit.js";
import { nextTicketNumber } from "../lib/ticket-number.js";
import { saveTicketUpload } from "../lib/upload-storage.js";
import { streamTicketAttachmentFile } from "../lib/serve-ticket-attachment.js";
import {
  ensureSupportOrganizationForProject,
  slugifySupportOrganizationName,
  syncConsultantAccessForOrganization,
} from "../../lib/support-organization.js";
import { listSupportPortalOrganizations } from "../lib/support-portal-orgs.js";
import {
  canPerformLifecycleAction,
  nextStatusForLifecycleAction,
  resolveTicketLifecycleActor,
  type TicketLifecycleAction,
} from "../lib/ticket-lifecycle.js";
import { autoCloseStaleResolvedTickets } from "../lib/auto-close-resolved-tickets.js";
import { notifyAsync } from "../../lib/notifications/index.js";
import { serializeTicketRow, ticketDetailIncludes } from "../lib/serialize-ticket.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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

const lifecycleSchema = z.object({
  action: z.enum(["reopen", "start_work", "client_info_needed", "resolve", "close", "cancel"]),
  resolutionNotes: z.string().max(20000).optional(),
});

const ticketCreateSchema = z.object({
  type: z.nativeEnum(TicketType),
  priority: z.nativeEnum(TicketPriority).optional(),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(20000),
  organizationId: z.string().min(1),
});

const router: IRouter = Router();

router.use(tbosAuthMiddleware);

router.get("/session", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const actorId = await resolveTbosActorUserId(tbosUser);
  const ticketingUser = await prisma.ticketingUser.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, consultantVerified: true, email: true, name: true },
  });
  res.json({
    data: {
      ticketingUserId: actorId,
      role: ticketingUser?.role ?? null,
      consultantVerified: Boolean(ticketingUser?.consultantVerified),
      tbosRole: tbosUser.role,
    },
  });
});

function isTbosAdminRole(role: string) {
  const r = role.trim().toLowerCase();
  return r === "admin" || r === "customer_support";
}

async function orgFilterForTbos(tbosUser: { id: string; role: string }) {
  if (isTbosAdminRole(tbosUser.role)) return {};
  const consultant = await prisma.ticketingUser.findFirst({
    where: { tbosAdminUserId: tbosUser.id, role: "CONSULTANT", consultantVerified: true },
  });
  if (!consultant) return { organizationId: { in: [] as string[] } };
  const orgIds = await assignedOrganizationIds(consultant.id);
  return { organizationId: { in: orgIds } };
}

async function supportLinkedProjectIds(tbosUser: { id: string; role: string }): Promise<string[]> {
  if (isTbosAdminRole(tbosUser.role)) {
    const orgs = await prisma.organization.findMany({
      where: { active: true, projectId: { not: null } },
      select: { projectId: true },
    });
    return orgs.map((o) => o.projectId).filter((id): id is string => Boolean(id));
  }
  const orgScope = await orgFilterForTbos(tbosUser);
  if (!orgScope.organizationId || typeof orgScope.organizationId !== "object") {
    return [];
  }
  const orgs = await prisma.organization.findMany({
    where: { id: { in: orgScope.organizationId.in }, projectId: { not: null } },
    select: { projectId: true },
  });
  return orgs.map((o) => o.projectId).filter((id): id is string => Boolean(id));
}

router.get("/timesheets/summary", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const projectIds = await supportLinkedProjectIds(tbosUser);
  if (!projectIds.length) {
    return res.json({ data: { total: 0, pendingApproval: 0 } });
  }
  const [total, pendingApproval] = await Promise.all([
    prisma.timesheet.count({
      where: { projectId: { in: projectIds }, status: { in: ["SUBMITTED", "APPROVED"] } },
    }),
    prisma.timesheet.count({
      where: { projectId: { in: projectIds }, status: "SUBMITTED" },
    }),
  ]);
  res.json({ data: { total, pendingApproval } });
});

router.get("/tickets", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const organizationId = typeof req.query.organizationId === "string" ? req.query.organizationId : "";

  const orgScope = await orgFilterForTbos(tbosUser);
  const where: {
    organizationId?: string | { in: string[] };
    status?: TicketStatus;
  } = { ...orgScope };

  if (organizationId) {
    if (orgScope.organizationId && typeof orgScope.organizationId === "object") {
      if (!orgScope.organizationId.in.includes(organizationId)) {
        return res.json({ data: [] });
      }
    }
    where.organizationId = organizationId;
  }

  if (status && Object.values(TicketStatus).includes(status as TicketStatus)) {
    where.status = status as TicketStatus;
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
  res.json({
    data: withProjects.map((row) => serializeTicketRow(row)),
  });
});

router.get("/tickets/activity/recent", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const orgScope = await orgFilterForTbos(tbosUser);
  const tickets = await prisma.ticket.findMany({
    where: orgScope,
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

router.post("/tickets", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const parsed = ticketCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error" });

  const orgScope = await orgFilterForTbos(tbosUser);
  const orgWhere: { id: string; active: boolean; projectId?: string | null } = {
    id: parsed.data.organizationId,
    active: true,
  };
  if (orgScope.organizationId && typeof orgScope.organizationId === "object") {
    if (!orgScope.organizationId.in.includes(parsed.data.organizationId)) {
      return res.status(400).json({ error: "Invalid organization" });
    }
  }

  const org = await prisma.organization.findFirst({
    where: {
      ...orgWhere,
      projectId: { not: null },
      project: { status: "ACTIVE" },
    },
    select: { id: true, projectId: true },
  });
  if (!org) return res.status(400).json({ error: "Invalid organization" });

  const actorId = await resolveTbosActorUserId(tbosUser);
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
      subject: parsed.data.subject.trim(),
      description: parsed.data.description.trim(),
      createdById: actorId,
      updatedById: actorId,
    },
    include: ticketDetailIncludes,
  });

  await logTicketAudit(ticket.id, actorId, "CREATED", {
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
      return res.status(201).json({ data: serializeTicketRow(refreshed) });
    }
  }

  res.status(201).json({ data: serializeTicketRow(ticket) });
});

router.get("/tickets/:ticketId/attachments/:attachmentId/file", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const orgScope = await orgFilterForTbos(tbosUser);
  const ticket = await prisma.ticket.findFirst({
    where: { id: req.params.ticketId, ...orgScope },
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const attachment = await prisma.ticketAttachment.findFirst({
    where: { id: req.params.attachmentId, ticketId: ticket.id },
  });
  if (!attachment) return res.status(404).json({ error: "Attachment not found" });

  const download = req.query.download === "1" || req.query.download === "true";
  await streamTicketAttachmentFile(attachment, res, { download });
});

router.get("/tickets/:id", async (req: TbosRequest, res) => {
  await autoCloseStaleResolvedTickets();
  const tbosUser = req.tbosUser!;
  const orgScope = await orgFilterForTbos(tbosUser);
  const ticket = await prisma.ticket.findFirst({
    where: { id: req.params.id, ...orgScope },
    include: {
      ...ticketDetailIncludes,
      attachments: { orderBy: { createdAt: "asc" } },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { actor: { select: { id: true, name: true } } },
      },
    },
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: ticket.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true, role: true } } },
  });

  const { enrichTicketsProjectLabels } = await import("../lib/ticket-project-label.js");
  const [withProject] = await enrichTicketsProjectLabels([ticket]);

  res.json({
    data: {
      ...serializeTicketRow(withProject ?? ticket),
      attachments: ticket.attachments,
      messages,
      auditLogs: ticket.auditLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
    },
  });
});

router.post("/tickets/:id/lifecycle", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const parsed = lifecycleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error" });

  const orgScope = await orgFilterForTbos(tbosUser);
  const existing = await prisma.ticket.findFirst({
    where: { id: req.params.id, ...orgScope },
  });
  if (!existing) return res.status(404).json({ error: "Ticket not found" });

  const action = parsed.data.action as TicketLifecycleAction;
  const actorId = await resolveTbosActorUserId(tbosUser);
  const actorTicketing = await prisma.ticketingUser.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, consultantVerified: true },
  });
  const { role, isCreator } = await resolveTicketLifecycleActor({
    ticketingUser: actorTicketing ?? { id: actorId, role: "CLIENT", consultantVerified: false },
    ticketCreatedById: existing.createdById,
    impersonatorId: tbosUser.impersonatorId,
  });
  if (!canPerformLifecycleAction(role, action, { isCreator })) {
    return res.status(403).json({ error: "Not allowed to perform this action" });
  }

  const nextStatus = nextStatusForLifecycleAction(existing.status, action);
  if (!nextStatus) return res.status(400).json({ error: "Invalid status transition" });

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
    data: { ...data, updatedById: actorId },
    include: ticketDetailIncludes,
  });

  await logTicketAudit(existing.id, actorId, "UPDATED", {
    field: "status",
    oldValue: existing.status,
    newValue: nextStatus,
    metadata: { lifecycleAction: action },
  });

  notifyAsync("ticket.status.changed", {
    ticketId: existing.id,
    oldStatus: existing.status,
    newStatus: nextStatus,
    actorEmail: tbosUser.email,
  });

  res.json({ data: serializeTicketRow(updated) });
});

router.post("/organizations/from-project/:projectId", requireTbosAdmin, async (req: TbosRequest, res) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId) return res.status(400).json({ error: "Project id is required" });
    const org = await ensureSupportOrganizationForProject(projectId);
    res.status(201).json({
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        projectId: org.projectId,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({ error: "TBOS project not found" });
    }
    console.error("Error linking support organization:", error);
    res.status(500).json({ error: "Failed to link support project" });
  }
});

router.post("/organizations", requireTbosAdmin, async (req: TbosRequest, res) => {
  const parsed = z
    .object({
      name: z.string().min(1).max(200),
      projectId: z.string().min(1).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Project name is required" });

  if (parsed.data.projectId) {
    const linked = await prisma.organization.findFirst({ where: { projectId: parsed.data.projectId } });
    if (linked) {
      return res.status(400).json({ error: "This delivery project already has a support portal project" });
    }
    const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
    if (!project) return res.status(404).json({ error: "TBOS project not found" });
  }

  const baseSlug = slugifySupportOrganizationName(parsed.data.name) || "project";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const row = await prisma.organization.create({
    data: {
      name: parsed.data.name.trim(),
      slug,
      active: true,
      projectId: parsed.data.projectId ?? null,
    },
    select: { id: true, name: true, slug: true, projectId: true },
  });
  if (row.projectId) {
    await syncConsultantAccessForOrganization(row.id);
  }
  res.status(201).json({ data: row });
});

router.get("/organizations", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const orgScope = await orgFilterForTbos(tbosUser);
  const scopeIds =
    orgScope.organizationId && typeof orgScope.organizationId === "object"
      ? orgScope.organizationId.in
      : isTbosAdminRole(tbosUser.role)
        ? null
        : [];

  const rows = await listSupportPortalOrganizations(scopeIds);
  res.json({ data: rows });
});

router.put("/consultants/:consultantId/organizations", requireTbosAdmin, async (req: TbosRequest, res) => {
  const parsed = z.object({ organizationIds: z.array(z.string()) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "organizationIds array required" });

  const consultant = await prisma.ticketingUser.findFirst({
    where: { id: req.params.consultantId, role: "CONSULTANT" },
  });
  if (!consultant) return res.status(404).json({ error: "Consultant not found" });

  await prisma.consultantOrganization.deleteMany({ where: { consultantId: consultant.id } });
  if (parsed.data.organizationIds.length > 0) {
    await prisma.consultantOrganization.createMany({
      data: parsed.data.organizationIds.map((organizationId) => ({
        consultantId: consultant.id,
        organizationId,
      })),
      skipDuplicates: true,
    });
  }

  const assigned = await prisma.consultantOrganization.findMany({
    where: { consultantId: consultant.id },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });
  res.json({ data: assigned.map((a) => a.organization) });
});

router.get("/assignees", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const ticketId = typeof req.query.ticketId === "string" ? req.query.ticketId : "";
  if (ticketId) {
    const orgScope = await orgFilterForTbos(tbosUser);
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, ...orgScope },
      select: { projectId: true, organization: { select: { projectId: true } } },
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    const projectId = ticket.projectId ?? ticket.organization?.projectId ?? null;
    const { listProjectTicketAssignees } = await import("../../lib/ticket-project-assignees.js");
    const rows = await listProjectTicketAssignees(projectId);
    return res.json({ data: rows });
  }
  if (isTbosAdminRole(tbosUser.role)) {
    const { listGlobalTicketAssignees } = await import("../../lib/ticket-project-assignees.js");
    return res.json({ data: await listGlobalTicketAssignees() });
  }
  res.json({ data: [] });
});

router.patch("/tickets/:id", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const parsed = ticketUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error" });
  if (parsed.data.status !== undefined) {
    return res.status(400).json({ error: "Use lifecycle actions to change status" });
  }

  const orgScope = await orgFilterForTbos(tbosUser);
  const existing = await prisma.ticket.findFirst({
    where: { id: req.params.id, ...orgScope },
  });
  if (!existing) return res.status(404).json({ error: "Ticket not found" });

  if (existing.status === TicketStatus.CLOSED || existing.status === TicketStatus.CANCELLED) {
    return res.status(400).json({ error: "Cannot edit a closed or cancelled ticket" });
  }

  const actorId = await resolveTbosActorUserId(tbosUser);
  if (parsed.data.assignedToId !== undefined) {
    const { resolveTicketProjectId, isValidProjectTicketAssignee } = await import(
      "../../lib/ticket-project-assignees.js"
    );
    const projectId = await resolveTicketProjectId(existing);
    const ok = await isValidProjectTicketAssignee(projectId, parsed.data.assignedToId, actorId);
    if (!ok) {
      return res.status(400).json({ error: "Assignee must be a member of the project support team" });
    }
  }
  const data: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    data[field] = value;
  }
  if (parsed.data.status === TicketStatus.CLOSED || parsed.data.status === TicketStatus.RESOLVED) {
    data.closedAt = new Date();
  }
  if (parsed.data.status && parsed.data.status !== TicketStatus.CLOSED && parsed.data.status !== TicketStatus.RESOLVED) {
    data.closedAt = null;
  }

  const updated = await prisma.ticket.update({
    where: { id: existing.id },
    data: { ...data, updatedById: actorId },
    include: ticketDetailIncludes,
  });

  for (const field of ["priority", "type", "assignedToId", "subject", "description"] as const) {
    const next = parsed.data[field];
    if (next === undefined) continue;
    const prev = existing[field];
    if (String(prev ?? "") !== String(next ?? "")) {
      if (field === "assignedToId") {
        const { formatTicketAssigneeAuditValue } = await import("../lib/ticket-audit.js");
        const oldValue = await formatTicketAssigneeAuditValue(
          typeof prev === "string" ? prev : null,
        );
        const newValue = await formatTicketAssigneeAuditValue(
          typeof next === "string" ? next : null,
        );
        await logTicketAudit(existing.id, actorId, "UPDATED", {
          field,
          oldValue,
          newValue,
        });
      } else {
        await logTicketAudit(existing.id, actorId, "UPDATED", {
          field,
          oldValue: String(prev ?? ""),
          newValue: String(next ?? ""),
        });
      }
    }
  }

  res.json({ data: serializeTicketRow(updated) });
});

router.delete("/tickets/:id", requireTbosAdmin, async (req: TbosRequest, res) => {
  const existing = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Ticket not found" });

  const [timesheetCount, entryCount] = await Promise.all([
    prisma.timesheet.count({ where: { ticketId: existing.id } }),
    prisma.timesheetEntry.count({ where: { ticketId: existing.id } }),
  ]);
  if (timesheetCount > 0 || entryCount > 0) {
    return res.status(400).json({
      error: "Cannot delete a ticket that is linked to timesheets. Remove timesheet links first.",
    });
  }

  await prisma.ticket.delete({ where: { id: existing.id } });
  res.json({ message: "Deleted" });
});

router.post("/tickets/:id/messages", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error" });

  const orgScope = await orgFilterForTbos(tbosUser);
  const ticket = await prisma.ticket.findFirst({
    where: { id: req.params.id, ...orgScope },
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.CANCELLED) {
    return res.status(400).json({ error: "Cannot add messages to a closed or cancelled ticket" });
  }

  const actorId = await resolveTbosActorUserId(tbosUser);
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: actorId,
      body: parsed.data.body.trim(),
      isInternal: Boolean(parsed.data.isInternal),
    },
    include: { author: { select: { id: true, name: true, email: true, role: true } } },
  });

  const statusPatch: { status?: TicketStatus } = {};
  const author = await prisma.ticketingUser.findUnique({
    where: { id: actorId },
    select: { role: true },
  });
  if (
    author?.role === "CLIENT" &&
    ticket.status === TicketStatus.PENDING_CLIENT &&
    !message.isInternal
  ) {
    statusPatch.status = TicketStatus.IN_PROGRESS;
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { updatedAt: new Date(), updatedById: actorId, ...statusPatch },
  });

  if (statusPatch.status) {
    await logTicketAudit(ticket.id, actorId, "UPDATED", {
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

  await logTicketAudit(ticket.id, actorId, "MESSAGE_ADDED", {
    metadata: { messageId: message.id, isInternal: message.isInternal },
  });

  if (!message.isInternal) {
    notifyAsync("ticket.message", { ticketId: ticket.id, messageId: message.id });
  }

  res.status(201).json({ data: message });
});

router.post("/tickets/:id/attachments/upload", upload.single("file"), async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const orgScope = await orgFilterForTbos(tbosUser);
  const ticket = await prisma.ticket.findFirst({
    where: { id: req.params.id, ...orgScope },
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.CANCELLED) {
    return res.status(400).json({ error: "Cannot upload files to a closed or cancelled ticket" });
  }

  const actorId = await resolveTbosActorUserId(tbosUser);
  try {
    const stored = await saveTicketUpload(req.file);
    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId: ticket.id,
        fileName: stored.fileName,
        fileUrl: stored.fileUrl,
        storageKey: stored.storageKey,
        fileSize: stored.fileSize,
        uploadedById: actorId,
      },
    });
    await logTicketAudit(ticket.id, actorId, "ATTACHMENT_ADDED", {
      metadata: { fileName: attachment.fileName },
    });
    res.status(201).json({ data: attachment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    res.status(400).json({ error: message });
  }
});

router.get("/consultants", requireTbosAdmin, async (_req, res) => {
  const rows = await prisma.ticketingUser.findMany({
    where: { role: "CONSULTANT", consultantVerified: true },
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      tbosRole: true,
      consultantOrganizations: {
        include: { organization: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  res.json({
    data: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      tbosRole: r.tbosRole,
      organizations: r.consultantOrganizations.map((c) => c.organization),
    })),
  });
});

export { router as tbosRoutes };
