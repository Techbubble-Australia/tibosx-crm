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

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ticketUpdateSchema = z.object({
  type: z.nativeEnum(TicketType).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  subject: z.string().min(1).max(300).optional(),
  description: z.string().min(1).max(20000).optional(),
  assignedToId: z.string().nullable().optional(),
});

const messageSchema = z.object({
  body: z.string().min(1).max(20000),
  isInternal: z.boolean().optional(),
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

function isTbosAdminRole(role: string) {
  return role.trim().toLowerCase() === "admin";
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
    prisma.timesheet.count({ where: { projectId: { in: projectIds } } }),
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
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({
    data: rows.map((row) => ({
      id: row.id,
      ticketNumber: row.ticketNumber,
      organizationId: row.organizationId,
      organization: row.organization,
      type: row.type,
      priority: row.priority,
      status: row.status,
      subject: row.subject,
      description: row.description,
      createdById: row.createdById,
      createdBy: row.createdBy,
      assignedToId: row.assignedToId,
      assignedTo: row.assignedTo,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      closedAt: row.closedAt?.toISOString() ?? null,
    })),
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
    data: latestActivityPerTicket(logs).map(serializeTicketActivityRow),
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
    },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await logTicketAudit(ticket.id, actorId, "CREATED", {
    metadata: { type: ticket.type, priority: ticket.priority },
  });

  if (projectId) {
    const { assignTicketToSupportGroup, notifySupportGroupOfTicket } = await import(
      "../../lib/support-project.js"
    );
    await assignTicketToSupportGroup(ticket.id, projectId);
    void notifySupportGroupOfTicket(ticket.id);
    const refreshed = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    if (refreshed) {
      return res.status(201).json({
        data: {
          ...refreshed,
          createdAt: refreshed.createdAt.toISOString(),
          updatedAt: refreshed.updatedAt.toISOString(),
          closedAt: refreshed.closedAt?.toISOString() ?? null,
        },
      });
    }
  }

  res.status(201).json({
    data: {
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      closedAt: ticket.closedAt?.toISOString() ?? null,
    },
  });
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
  const tbosUser = req.tbosUser!;
  const orgScope = await orgFilterForTbos(tbosUser);
  const ticket = await prisma.ticket.findFirst({
    where: { id: req.params.id, ...orgScope },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 50, include: { actor: { select: { id: true, name: true } } } },
    },
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: ticket.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true, role: true } } },
  });

  res.json({
    data: {
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      closedAt: ticket.closedAt?.toISOString() ?? null,
      messages,
    },
  });
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
  if (isTbosAdminRole(tbosUser.role)) {
    const rows = await prisma.ticketingUser.findMany({
      where: { role: "CONSULTANT", consultantVerified: true, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
    return res.json({ data: rows });
  }
  const actorId = await resolveTbosActorUserId(tbosUser);
  const self = await prisma.ticketingUser.findUnique({
    where: { id: actorId },
    select: { id: true, name: true, email: true },
  });
  res.json({ data: self ? [self] : [] });
});

router.patch("/tickets/:id", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const parsed = ticketUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error" });

  const orgScope = await orgFilterForTbos(tbosUser);
  const existing = await prisma.ticket.findFirst({
    where: { id: req.params.id, ...orgScope },
  });
  if (!existing) return res.status(404).json({ error: "Ticket not found" });

  const actorId = await resolveTbosActorUserId(tbosUser);
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
    data,
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  for (const field of ["status", "priority", "type", "assignedToId", "subject"] as const) {
    const next = parsed.data[field];
    if (next === undefined) continue;
    const prev = existing[field];
    if (String(prev ?? "") !== String(next ?? "")) {
      await logTicketAudit(existing.id, actorId, "UPDATED", {
        field,
        oldValue: String(prev ?? ""),
        newValue: String(next ?? ""),
      });
    }
  }

  res.json({
    data: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      closedAt: updated.closedAt?.toISOString() ?? null,
    },
  });
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

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { updatedAt: new Date() },
  });

  await logTicketAudit(ticket.id, actorId, "MESSAGE_ADDED", {
    metadata: { messageId: message.id, isInternal: message.isInternal },
  });

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
