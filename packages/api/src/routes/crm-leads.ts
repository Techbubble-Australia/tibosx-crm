import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "NURTURING",
  "UNQUALIFIED",
  "CONVERTED",
  "DISQUALIFIED",
] as const;

function serializeLead(row: any) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    status: row.status,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    company: row.company,
    title: row.title,
    source: row.source,
    country: row.country,
    message: row.message,
    ownerId: row.ownerId,
    owner: row.owner
      ? { id: row.owner.id, name: row.owner.name, email: row.owner.email }
      : null,
    clientId: row.clientId,
    contactId: row.contactId,
    contactSubmissionId: row.contactSubmissionId,
    customFields: row.customFields,
    convertedAt: row.convertedAt,
    opportunity: row.opportunity
      ? { id: row.opportunity.id, name: row.opportunity.name }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.get("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const source = typeof req.query.source === "string" ? req.query.source.trim() : "";
  const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId.trim() : "";
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  /** Wireframe "Status: open" = active pipeline (not converted / disqualified / unqualified). */
  const statusFilter =
    status === "open"
      ? { status: { in: ["NEW", "CONTACTED", "QUALIFIED", "NURTURING"] } }
      : status
        ? { status }
        : {};

  const leads = await prisma.lead.findMany({
    where: {
      tenantId,
      ...statusFilter,
      ...(source ? { source } : {}),
      ...(ownerId === "unassigned"
        ? { ownerId: null }
        : ownerId
          ? { ownerId }
          : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      opportunity: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return res.json({ data: leads.map(serializeLead) });
});

const leadSchema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  source: z.string().max(80).optional().default("manual"),
  country: z.string().max(120).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  status: z.enum(LEAD_STATUSES).optional(),
  ownerId: z.string().optional().nullable(),
  customFields: z.record(z.unknown()).optional().nullable(),
});

router.post("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const lead = await prisma.lead.create({
    data: {
      tenantId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone ?? null,
      company: parsed.data.company ?? null,
      title: parsed.data.title ?? null,
      source: parsed.data.source ?? "manual",
      country: parsed.data.country ?? null,
      message: parsed.data.message ?? null,
      status: parsed.data.status ?? "NEW",
      ownerId: parsed.data.ownerId ?? req.user?.id ?? null,
      customFields: (parsed.data.customFields as object | undefined) ?? undefined,
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      opportunity: { select: { id: true, name: true } },
    },
  });
  return res.status(201).json({ data: serializeLead(lead) });
});

router.get("/:id", async (req: AuthRequest, res) => {
  const lead = await prisma.lead.findFirst({
    where: { id: req.params.id, tenantId: req.tenant!.tenantId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      opportunity: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true, email: true } },
    },
  });
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  return res.json({ data: serializeLead(lead) });
});

router.put("/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.lead.findFirst({
    where: { id: req.params.id, tenantId: req.tenant!.tenantId },
  });
  if (!existing) return res.status(404).json({ error: "Lead not found" });
  const parsed = leadSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const lead = await prisma.lead.update({
    where: { id: existing.id },
    data: {
      ...parsed.data,
      email: parsed.data.email?.toLowerCase(),
      customFields:
        parsed.data.customFields === null
          ? undefined
          : ((parsed.data.customFields as object | undefined) ?? undefined),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      opportunity: { select: { id: true, name: true } },
    },
  });
  return res.json({ data: serializeLead(lead) });
});

const convertSchema = z.object({
  createClient: z.boolean().default(true),
  clientId: z.string().optional().nullable(),
  clientName: z.string().max(200).optional(),
  opportunityName: z.string().max(200).optional(),
  amount: z.coerce.number().nonnegative().optional().default(0),
  currency: z.string().max(8).optional().default("AUD"),
});

router.post("/:id/convert", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const lead = await prisma.lead.findFirst({
    where: { id: req.params.id, tenantId },
  });
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  if (lead.status === "CONVERTED") {
    return res.status(400).json({ error: "Lead already converted" });
  }
  const parsed = convertSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const pipeline = await prisma.crmPipeline.findFirst({
    where: { tenantId, isDefault: true, active: true },
    include: { stages: { orderBy: { order: "asc" }, take: 1 } },
  });
  const firstStage = pipeline?.stages[0];

  const result = await prisma.$transaction(async (tx) => {
    let clientId = parsed.data.clientId ?? lead.clientId;
    if (!clientId && parsed.data.createClient) {
      const name =
        parsed.data.clientName?.trim() ||
        lead.company?.trim() ||
        `${lead.firstName} ${lead.lastName}`.trim();
      const client = await tx.client.create({
        data: {
          tenantId,
          name,
          country: lead.country || "Australia",
          status: "PROSPECT",
          website: "",
        },
      });
      clientId = client.id;
    }
    if (!clientId) throw new Error("CLIENT_REQUIRED");

    const contact = await tx.clientContact.create({
      data: {
        tenantId,
        clientId,
        name: `${lead.firstName} ${lead.lastName}`.trim(),
        email: lead.email,
        phoneCountryCode: "+61",
        phoneNumber: lead.phone || "0000000000",
        position: lead.title || "",
      },
    });

    const opportunity = await tx.opportunity.create({
      data: {
        tenantId,
        name:
          parsed.data.opportunityName?.trim() ||
          `${lead.company || lead.firstName} — opportunity`,
        clientId,
        contactId: contact.id,
        location: lead.country || "Australia",
        type: "FIXED_PRICE",
        currency: parsed.data.currency ?? "AUD",
        amount: parsed.data.amount ?? 0,
        status: "DRAFT",
        active: true,
        ownerId: lead.ownerId ?? req.user?.id ?? null,
        leadId: lead.id,
        pipelineId: pipeline?.id ?? null,
        stageId: firstStage?.id ?? null,
        probability: firstStage?.winProbability ?? 10,
        nextStep: "Discovery call",
        nextStepDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    if (firstStage) {
      await tx.opportunityStageHistory.create({
        data: {
          opportunityId: opportunity.id,
          toStageId: firstStage.id,
          changedById: req.user?.id ?? null,
          note: "Created from lead convert",
        },
      });
    }

    const updatedLead = await tx.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONVERTED",
        convertedAt: new Date(),
        clientId,
        contactId: contact.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });

    return { lead: updatedLead, opportunity, contact, clientId };
  });

  return res.json({
    data: {
      lead: serializeLead(result.lead),
      opportunityId: result.opportunity.id,
      clientId: result.clientId,
      contactId: result.contact.id,
    },
  });
});

/** Ingest website contact submissions into leads (idempotent by contactSubmissionId). */
router.post("/sync-contact-submissions", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  let created = 0;
  for (const s of submissions) {
    const existing = await prisma.lead.findUnique({
      where: { contactSubmissionId: s.id },
    });
    if (existing) continue;
    await prisma.lead.create({
      data: {
        tenantId,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email.toLowerCase(),
        phone: s.phone,
        company: s.company,
        source: "website",
        country: s.country,
        message: s.message,
        title: s.interest,
        contactSubmissionId: s.id,
        status: "NEW",
      },
    });
    created += 1;
  }
  return res.json({ data: { created, scanned: submissions.length } });
});

export { router as crmLeadRoutes };
