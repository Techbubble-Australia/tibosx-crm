import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, type Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { OPPORTUNITY_STATUSES } from "../lib/opportunity-status";
import { OPPORTUNITY_TYPES, OPPORTUNITY_TYPE_LABELS } from "../lib/opportunity-types";

const router: IRouter = Router();

const opportunitySchema = z.object({
  name: z.string().min(1).max(200),
  clientId: z.string().min(1),
  location: z.string().min(1, "Location is required").max(120),
  type: z.enum(OPPORTUNITY_TYPES),
  contactId: z.string().optional().nullable(),
  currency: z.string().min(1).max(8),
  amount: z.coerce.number().positive("Estimated value must be greater than zero"),
  status: z.enum(OPPORTUNITY_STATUSES).default("DRAFT"),
  comments: z.string().max(5000).optional().default(""),
  ownerId: z.string().min(1).optional().nullable(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
  pipelineId: z.string().optional().nullable(),
  stageId: z.string().optional().nullable(),
  nextStep: z.string().max(2000).optional().nullable(),
  nextStepDue: z.string().datetime().optional().nullable(),
  engagementModel: z.string().max(40).optional().nullable(),
  closeReason: z.string().max(2000).optional().nullable(),
  probability: z.number().int().min(0).max(100).optional().nullable(),
});

const listFieldsSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(OPPORTUNITY_TYPES).optional(),
  location: z.string().min(1).max(120).optional(),
  amount: z.coerce.number().positive().optional(),
  status: z.enum(OPPORTUNITY_STATUSES).optional(),
  contactId: z.string().nullable().optional(),
  active: z.boolean().optional(),
  stageId: z.string().optional().nullable(),
  nextStep: z.string().max(2000).optional().nullable(),
  nextStepDue: z.string().datetime().optional().nullable(),
});

async function allocateNextOpportunityOrder(): Promise<number> {
  const result = await prisma.opportunity.aggregate({ _max: { order: true } });
  return (result._max.order ?? 0) + 1;
}

async function ensureOpportunityClient(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    throw new Error("CLIENT_NOT_FOUND");
  }
  if (client.status === "INACTIVE") {
    throw new Error("CLIENT_INACTIVE");
  }
  return client;
}

async function ensureOpportunityOwner(ownerId: string | null | undefined) {
  if (!ownerId) throw new Error("OWNER_REQUIRED");
  const owner = await prisma.adminUser.findFirst({
    where: { id: ownerId, active: true },
  });
  if (!owner) throw new Error("OWNER_NOT_FOUND");
}

async function ensureOpportunityContact(clientId: string, contactId: string | null | undefined) {
  if (!contactId) return;
  const contact = await prisma.clientContact.findFirst({
    where: { id: contactId, clientId },
  });
  if (!contact) {
    throw new Error("CONTACT_NOT_FOUND");
  }
}

async function applyAcceptedClientPromotion(clientId: string, tx: Prisma.TransactionClient) {
  const client = await tx.client.findUnique({ where: { id: clientId } });
  if (client?.status === "PROSPECT") {
    await tx.client.update({
      where: { id: clientId },
      data: { status: "ACTIVE" },
    });
  }
}

function serializeOpportunity(row: {
  id: string;
  name: string;
  clientId: string;
  location: string;
  type: string;
  contactId: string | null;
  ownerId: string | null;
  currency: string;
  amount: { toString(): string } | number;
  status: string;
  comments: string;
  order: number;
  active: boolean;
  pipelineId?: string | null;
  stageId?: string | null;
  probability?: number | null;
  nextStep?: string | null;
  nextStepDue?: Date | null;
  engagementModel?: string | null;
  closeReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: { id: string; name: string; status: string } | null;
  contact?: { id: string; name: string; email: string } | null;
  owner?: { id: string; name: string | null; email: string } | null;
  stage?: { id: string; name: string; stageType: string; winProbability: number; order: number } | null;
  pipeline?: { id: string; name: string } | null;
  jobs?: Array<{ id: string; published: boolean }>;
  quotes?: Array<{ id: string; quoteNumber: string; status: string; totalAmount: { toString(): string } | number }>;
}) {
  const amount = typeof row.amount === "number" ? row.amount : Number(row.amount.toString());
  const type = row.type as keyof typeof OPPORTUNITY_TYPE_LABELS;
  return {
    id: row.id,
    name: row.name,
    clientId: row.clientId,
    clientName: row.client?.name ?? "",
    clientStatus: row.client?.status ?? "",
    location: row.location,
    type: row.type,
    typeLabel: OPPORTUNITY_TYPE_LABELS[type] ?? row.type,
    contactId: row.contactId,
    contactName: row.contact?.name ?? "",
    ownerId: row.ownerId,
    ownerName: row.owner?.name || row.owner?.email || "",
    currency: row.currency,
    amount,
    status: row.status,
    comments: row.comments,
    order: row.order,
    active: row.active,
    pipelineId: row.pipelineId ?? null,
    pipelineName: row.pipeline?.name ?? "",
    stageId: row.stageId ?? null,
    stageName: row.stage?.name ?? "",
    stageType: row.stage?.stageType ?? null,
    probability: row.probability ?? row.stage?.winProbability ?? null,
    nextStep: row.nextStep ?? null,
    nextStepDue: row.nextStepDue ?? null,
    engagementModel: row.engagementModel ?? null,
    closeReason: row.closeReason ?? null,
    quotes: (row.quotes ?? []).map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      status: q.status,
      totalAmount: typeof q.totalAmount === "number" ? q.totalAmount : Number(q.totalAmount.toString()),
    })),
    activeJobsCount: row.jobs?.filter((job) => job.published).length ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const opportunityInclude = {
  client: { select: { id: true, name: true, status: true } },
  contact: { select: { id: true, name: true, email: true } },
  owner: { select: { id: true, name: true, email: true } },
  stage: { select: { id: true, name: true, stageType: true, winProbability: true, order: true } },
  pipeline: { select: { id: true, name: true } },
};

router.get("/next-order", async (_req, res) => {
  try {
    const order = await allocateNextOpportunityOrder();
    res.json({ data: { order } });
  } catch (error) {
    console.error("Error fetching next opportunity order:", error);
    res.status(500).json({ error: "Failed to fetch next order" });
  }
});

router.get("/board", async (req: AuthRequest, res) => {
  try {
    const tenantId = req.tenant?.tenantId;
    const pipelineId =
      typeof req.query.pipelineId === "string" ? req.query.pipelineId : undefined;
    const pipeline = await prisma.crmPipeline.findFirst({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(pipelineId ? { id: pipelineId } : { isDefault: true }),
        active: true,
      },
      include: { stages: { orderBy: { order: "asc" } } },
    });
    const where: Prisma.OpportunityWhereInput = {
      active: true,
      ...(tenantId ? { tenantId } : {}),
      ...(pipeline ? { pipelineId: pipeline.id } : {}),
    };
    const rows = await prisma.opportunity.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        ...opportunityInclude,
        jobs: { select: { id: true, published: true } },
      },
    });
    res.json({
      data: {
        pipeline,
        columns: (pipeline?.stages ?? []).map((stage) => ({
          stage,
          opportunities: rows
            .filter((r) => r.stageId === stage.id)
            .map(serializeOpportunity),
        })),
        unstaged: rows.filter((r) => !r.stageId).map(serializeOpportunity),
      },
    });
  } catch (error) {
    console.error("Error fetching opportunity board:", error);
    res.status(500).json({ error: "Failed to fetch board" });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";
    const activeParam = typeof req.query.active === "string" ? req.query.active : "";
    const stageId = typeof req.query.stageId === "string" ? req.query.stageId : "";
    const activeFilter =
      activeParam === "true" ? true : activeParam === "false" ? false : undefined;
    const where: Prisma.OpportunityWhereInput = {};
    if (req.tenant?.tenantId) where.tenantId = req.tenant.tenantId;
    if (clientId) where.clientId = clientId;
    if (activeFilter !== undefined) where.active = activeFilter;
    if (stageId) where.stageId = stageId;
    const rows = await prisma.opportunity.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        ...opportunityInclude,
        jobs: { select: { id: true, published: true } },
      },
    });
    res.json({ data: rows.map(serializeOpportunity) });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

router.post("/:id/stage", async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      stageId: z.string().min(1),
      note: z.string().max(2000).optional(),
      closeReason: z.string().max(2000).optional().nullable(),
    });
    const data = schema.parse(req.body);
    const existing = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const stage = await prisma.crmStage.findFirst({
      where: {
        id: data.stageId,
        ...(req.tenant?.tenantId ? { pipeline: { tenantId: req.tenant.tenantId } } : {}),
      },
    });
    if (!stage) return res.status(400).json({ error: "Stage not found" });

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.opportunity.update({
        where: { id: existing.id },
        data: {
          stageId: stage.id,
          pipelineId: stage.pipelineId,
          probability: stage.winProbability,
          closeReason: data.closeReason === undefined ? undefined : data.closeReason,
          status:
            stage.stageType === "won"
              ? "ACCEPTED"
              : stage.stageType === "lost"
                ? "REJECTED"
                : existing.status === "ACCEPTED" || existing.status === "REJECTED"
                  ? "IN_PROGRESS"
                  : existing.status,
          active: stage.stageType === "lost" ? false : existing.active,
        },
        include: opportunityInclude,
      });
      await tx.opportunityStageHistory.create({
        data: {
          opportunityId: existing.id,
          fromStageId: existing.stageId,
          toStageId: stage.id,
          changedById: req.user?.id ?? null,
          note: data.note ?? null,
        },
      });
      if (stage.stageType === "won") {
        await applyAcceptedClientPromotion(existing.clientId, tx);
      }
      return updated;
    });
    res.json({ data: serializeOpportunity(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error moving opportunity stage:", error);
    res.status(500).json({ error: "Failed to move stage" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (req.params.id === "next-order" || req.params.id === "board") {
      return res.status(404).json({ error: "Not found" });
    }
    const row = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
      include: {
        ...opportunityInclude,
        quotes: {
          select: { id: true, quoteNumber: true, status: true, totalAmount: true },
          orderBy: { createdAt: "desc" },
        },
        stageHistory: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            fromStage: { select: { id: true, name: true } },
            toStage: { select: { id: true, name: true } },
          },
        },
        jobs: {
          select: {
            id: true,
            title: true,
            referenceNumber: true,
            published: true,
            type: true,
            order: true,
            country: true,
            city: true,
          },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    const { jobs, stageHistory, ...rest } = row;
    res.json({
      data: {
        ...serializeOpportunity(rest),
        stageHistory,
        jobs: jobs.map((job) => ({
          id: job.id,
          title: job.title,
          referenceNumber: job.referenceNumber,
          published: job.published,
          type: job.type,
          order: job.order,
          location: [job.city, job.country].filter(Boolean).join(", ") || job.country || "",
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const data = opportunitySchema.parse(req.body);
    await ensureOpportunityClient(data.clientId);
    await ensureOpportunityContact(data.clientId, data.contactId);
    const ownerId = data.ownerId ?? req.user?.id ?? null;
    await ensureOpportunityOwner(ownerId);
    const order = data.order && data.order > 0 ? data.order : await allocateNextOpportunityOrder();

    const tenantId = req.tenant?.tenantId ?? null;
    let pipelineId = data.pipelineId ?? null;
    let stageId = data.stageId ?? null;
    let probability = data.probability ?? null;
    if (tenantId && (!pipelineId || !stageId)) {
      const pipeline = await prisma.crmPipeline.findFirst({
        where: { tenantId, isDefault: true, active: true },
        include: { stages: { orderBy: { order: "asc" }, take: 1 } },
      });
      if (pipeline) {
        pipelineId = pipelineId ?? pipeline.id;
        stageId = stageId ?? pipeline.stages[0]?.id ?? null;
        probability = probability ?? pipeline.stages[0]?.winProbability ?? null;
      }
    }

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.opportunity.create({
        data: {
          tenantId,
          name: data.name,
          clientId: data.clientId,
          location: data.location,
          type: data.type,
          contactId: data.contactId ?? null,
          ownerId,
          currency: data.currency,
          amount: data.amount,
          status: data.status,
          comments: data.comments ?? "",
          order,
          active: data.active ?? true,
          pipelineId,
          stageId,
          probability,
          nextStep: data.nextStep ?? null,
          nextStepDue: data.nextStepDue ? new Date(data.nextStepDue) : null,
          engagementModel: data.engagementModel ?? null,
          closeReason: data.closeReason ?? null,
        },
        include: opportunityInclude,
      });
      if (stageId) {
        await tx.opportunityStageHistory.create({
          data: {
            opportunityId: created.id,
            toStageId: stageId,
            changedById: req.user?.id ?? null,
            note: "Created",
          },
        });
      }
      if (data.status === "ACCEPTED") {
        await applyAcceptedClientPromotion(data.clientId, tx);
      }
      return created;
    });

    res.status(201).json({ data: serializeOpportunity(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
      return res.status(400).json({ error: "Client not found" });
    }
    if (error instanceof Error && error.message === "CLIENT_INACTIVE") {
      return res.status(400).json({ error: "Cannot link opportunity to an inactive client" });
    }
    if (error instanceof Error && error.message === "CONTACT_NOT_FOUND") {
      return res.status(400).json({ error: "Contact not found for this client" });
    }
    if (error instanceof Error && error.message === "OWNER_REQUIRED") {
      return res.status(400).json({ error: "Owner is required" });
    }
    if (error instanceof Error && error.message === "OWNER_NOT_FOUND") {
      return res.status(400).json({ error: "Owner not found" });
    }
    console.error("Error creating opportunity:", error);
    res.status(500).json({ error: "Failed to create opportunity" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const data = opportunitySchema.partial().parse(req.body);
    const existing = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    const nextClientId = data.clientId ?? existing.clientId;
    if (data.clientId) {
      await ensureOpportunityClient(data.clientId);
    }
    if (data.contactId !== undefined) {
      await ensureOpportunityContact(nextClientId, data.contactId);
    }
    if (data.ownerId !== undefined) {
      await ensureOpportunityOwner(data.ownerId);
    }

    const updateData = {
      ...data,
      contactId: data.contactId === undefined ? undefined : data.contactId ?? null,
      ownerId: data.ownerId === undefined ? undefined : data.ownerId ?? null,
      ...(data.nextStepDue !== undefined
        ? { nextStepDue: data.nextStepDue ? new Date(data.nextStepDue) : null }
        : {}),
      ...(data.nextStep !== undefined ? { nextStep: data.nextStep ?? null } : {}),
      ...(data.status === "REJECTED" ? { active: false } : {}),
      ...(data.active === false ? { active: false } : {}),
    };

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.opportunity.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          ...opportunityInclude,
          jobs: { select: { id: true, published: true } },
        },
      });
      if (data.status === "ACCEPTED") {
        await applyAcceptedClientPromotion(updated.clientId, tx);
      }
      return updated;
    });

    res.json({ data: serializeOpportunity(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
      return res.status(400).json({ error: "Client not found" });
    }
    if (error instanceof Error && error.message === "CLIENT_INACTIVE") {
      return res.status(400).json({ error: "Cannot link opportunity to an inactive client" });
    }
    if (error instanceof Error && error.message === "CONTACT_NOT_FOUND") {
      return res.status(400).json({ error: "Contact not found for this client" });
    }
    console.error("Error updating opportunity:", error);
    res.status(500).json({ error: "Failed to update opportunity" });
  }
});

router.patch("/:id/list-fields", async (req, res) => {
  try {
    const data = listFieldsSchema.parse(req.body);
    const existing = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    if (data.contactId !== undefined) {
      await ensureOpportunityContact(existing.clientId, data.contactId);
    }

    const listUpdateData = {
      ...data,
      contactId: data.contactId === undefined ? undefined : data.contactId ?? null,
      ...(data.nextStepDue !== undefined
        ? { nextStepDue: data.nextStepDue ? new Date(data.nextStepDue) : null }
        : {}),
      ...(data.nextStep !== undefined ? { nextStep: data.nextStep ?? null } : {}),
      ...(data.status === "REJECTED" ? { active: false } : {}),
    };

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.opportunity.update({
        where: { id: req.params.id },
        data: listUpdateData,
        include: {
          ...opportunityInclude,
          jobs: { select: { id: true, published: true } },
        },
      });
      if (data.status === "ACCEPTED") {
        await applyAcceptedClientPromotion(updated.clientId, tx);
      }
      return updated;
    });

    res.json({ data: serializeOpportunity(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating opportunity list fields:", error);
    res.status(500).json({ error: "Failed to update opportunity" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.opportunity.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    res.status(500).json({ error: "Failed to delete opportunity" });
  }
});

router.get("/:id/available-jobs", async (req, res) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
      select: { clientId: true, location: true },
    });
    if (!opportunity) {
      return res.status(404).json({ error: "Not found" });
    }

    const jobs = await prisma.jobListing.findMany({
      where: {
        clientId: opportunity.clientId,
        country: opportunity.location,
        OR: [{ opportunityId: null }, { opportunityId: req.params.id }],
      },
      select: {
        id: true,
        title: true,
        referenceNumber: true,
        published: true,
        type: true,
        opportunityId: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    res.json({ data: jobs });
  } catch (error) {
    console.error("Error fetching available jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.post("/:id/link-job", async (req, res) => {
  try {
    const body = z.object({ jobId: z.string().min(1) }).parse(req.body);
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
      select: { id: true, clientId: true },
    });
    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    const job = await prisma.jobListing.findUnique({
      where: { id: body.jobId },
      select: {
        id: true,
        clientId: true,
        opportunityId: true,
        title: true,
        referenceNumber: true,
        published: true,
        type: true,
        order: true,
        country: true,
        city: true,
      },
    });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    if (job.clientId !== opportunity.clientId) {
      return res.status(400).json({ error: "Job must belong to the same client as the opportunity" });
    }
    if (job.opportunityId && job.opportunityId !== opportunity.id) {
      return res.status(409).json({ error: "This job is already linked to another opportunity" });
    }

    const updated = await prisma.jobListing.update({
      where: { id: job.id },
      data: { opportunityId: opportunity.id },
      select: {
        id: true,
        title: true,
        referenceNumber: true,
        published: true,
        type: true,
        order: true,
        country: true,
        city: true,
      },
    });

    res.json({
      data: {
        ...updated,
        location: [updated.city, updated.country].filter(Boolean).join(", ") || updated.country || "",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
    if (code === "P2002") {
      return res.status(409).json({
        error: "This job is already linked to another opportunity. Unlink it first or run the latest database migration.",
      });
    }
    console.error("Error linking job:", error);
    res.status(500).json({ error: "Failed to link job" });
  }
});

router.delete("/:id/jobs/:jobId", async (req, res) => {
  try {
    const job = await prisma.jobListing.findUnique({
      where: { id: req.params.jobId },
      select: { id: true, opportunityId: true },
    });
    if (!job || job.opportunityId !== req.params.id) {
      return res.status(404).json({ error: "Linked job not found" });
    }

    await prisma.jobListing.update({
      where: { id: job.id },
      data: { opportunityId: null },
    });

    res.json({ message: "Unlinked" });
  } catch (error) {
    console.error("Error unlinking job:", error);
    res.status(500).json({ error: "Failed to unlink job" });
  }
});

export { router as opportunityRoutes };
