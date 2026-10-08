import { Router, type IRouter } from "express";
import multer from "multer";
import { z } from "zod";
import {
  TicketPriority,
  TicketStatus,
  TicketType,
  ticketingPrisma,
} from "@techbubble/ticketing-database";
import { authMiddleware, type TicketingRequest } from "../middleware/auth.js";
import { logTicketAudit } from "../lib/ticket-audit.js";
import { nextTicketNumber } from "../lib/ticket-number.js";
import { canAccessTicketOrganization, ticketOrganizationFilter } from "../lib/ticket-access.js";
import { saveTicketUpload } from "../lib/upload-storage.js";
import { streamTicketAttachmentFile } from "../lib/serve-ticket-attachment.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
});

const messageSchema = z.object({
  body: z.string().min(1).max(20000),
  isInternal: z.boolean().optional(),
});


function serializeTicket(row: {
  id: string;
  ticketNumber: string;
  organizationId: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  createdById: string;
  assignedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  organization?: { id: string; name: string; slug: string };
  createdBy?: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string; email: string } | null;
}) {
  return {
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
  };
}

router.get("/", async (req: TicketingRequest, res) => {
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

  const rows = await ticketingPrisma.ticket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({ data: rows.map(serializeTicket) });
});

router.post("/", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const parsed = ticketCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error", details: parsed.error.errors });

  let organizationId = parsed.data.organizationId;
  if (user.role === "CLIENT") {
    if (!user.organizationId) return res.status(403).json({ error: "No organization linked" });
    organizationId = user.organizationId;
  } else {
    if (!organizationId) return res.status(400).json({ error: "organizationId is required for consultants" });
  }

  const org = await ticketingPrisma.organization.findFirst({
    where: { id: organizationId, active: true },
  });
  if (!org) return res.status(400).json({ error: "Invalid organization" });

  const ticketNumber = await nextTicketNumber();
  const ticket = await ticketingPrisma.ticket.create({
    data: {
      ticketNumber,
      organizationId: org.id,
      type: parsed.data.type,
      priority: parsed.data.priority ?? TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      subject: String(parsed.data.subject).trim(),
      description: String(parsed.data.description).trim(),
      createdById: user.id,
    },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await logTicketAudit(ticket.id, user.id, "CREATED", {
    metadata: { type: ticket.type, priority: ticket.priority },
  });

  res.status(201).json({ data: serializeTicket(ticket) });
});

router.get("/:id/attachments/:attachmentId/file", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const ticket = await ticketingPrisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const attachment = await ticketingPrisma.ticketAttachment.findFirst({
    where: { id: req.params.attachmentId, ticketId: ticket.id },
  });
  if (!attachment) return res.status(404).json({ error: "Attachment not found" });

  const download = req.query.download === "1" || req.query.download === "true";
  await streamTicketAttachmentFile(attachment, res, { download });
});

router.get("/:id", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const ticket = await ticketingPrisma.ticket.findUnique({
    where: { id: req.params.id },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { id: true, name: true } } } },
    },
  });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const messages = await ticketingPrisma.ticketMessage.findMany({
    where: {
      ticketId: ticket.id,
      ...(user.role === "CLIENT" ? { isInternal: false } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true, role: true } } },
  });

  res.json({
    data: {
      ...serializeTicket(ticket),
      attachments: ticket.attachments,
      messages,
      auditLogs: user.role === "CONSULTANT" ? ticket.auditLogs : [],
    },
  });
});

router.patch("/:id", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const parsed = ticketUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error", details: parsed.error.errors });

  const existing = await ticketingPrisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!existing || !(await canAccessTicketOrganization(user, existing.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const isConsultant = user.role === "CONSULTANT" && user.consultantVerified;
  if (!isConsultant) {
    const allowed = Object.keys(parsed.data).every((k) => k === "description" || k === "subject");
    if (!allowed || parsed.data.status || parsed.data.assignedToId !== undefined || parsed.data.priority || parsed.data.type) {
      return res.status(403).json({ error: "Clients can only update subject and description on open tickets" });
    }
    if (existing.status === TicketStatus.CLOSED || existing.status === TicketStatus.RESOLVED) {
      return res.status(400).json({ error: "Cannot edit a closed or resolved ticket" });
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

  const updated = await ticketingPrisma.ticket.update({
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

  const ticket = await ticketingPrisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const isConsultant = user.role === "CONSULTANT" && user.consultantVerified;
  if (parsed.data.isInternal && !isConsultant) {
    return res.status(403).json({ error: "Internal notes are consultant-only" });
  }

  const message = await ticketingPrisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: user.id,
      body: parsed.data.body.trim(),
      isInternal: Boolean(parsed.data.isInternal) && isConsultant,
    },
    include: { author: { select: { id: true, name: true, email: true, role: true } } },
  });

  await ticketingPrisma.ticket.update({
    where: { id: ticket.id },
    data: { updatedAt: new Date() },
  });

  await logTicketAudit(ticket.id, user.id, "MESSAGE_ADDED", {
    metadata: { messageId: message.id, isInternal: message.isInternal },
  });

  res.status(201).json({ data: message });
});

router.post("/:id/attachments/upload", upload.single("file"), async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const ticket = await ticketingPrisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  try {
    const stored = await saveTicketUpload(req.file);
    const attachment = await ticketingPrisma.ticketAttachment.create({
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

  const ticket = await ticketingPrisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket || !(await canAccessTicketOrganization(user, ticket.organizationId))) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const attachment = await ticketingPrisma.ticketAttachment.create({
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
