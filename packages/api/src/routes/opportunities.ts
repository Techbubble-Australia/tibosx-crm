import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, type Prisma } from "@techbubble/database";
import { OPPORTUNITY_STATUSES } from "../lib/opportunity-status";

const router: IRouter = Router();

const opportunitySchema = z.object({
  name: z.string().min(1).max(200),
  clientId: z.string().min(1),
  currency: z.string().min(1).max(8),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  status: z.enum(OPPORTUNITY_STATUSES).default("DRAFT"),
  comments: z.string().max(5000).optional().default(""),
  order: z.number().int().optional(),
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
  currency: string;
  amount: { toString(): string } | number;
  status: string;
  comments: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  client?: { id: string; name: string; status: string } | null;
}) {
  const amount = typeof row.amount === "number" ? row.amount : Number(row.amount.toString());
  return {
    id: row.id,
    name: row.name,
    clientId: row.clientId,
    clientName: row.client?.name ?? "",
    clientStatus: row.client?.status ?? "",
    currency: row.currency,
    amount,
    status: row.status,
    comments: row.comments,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.get("/next-order", async (_req, res) => {
  try {
    const order = await allocateNextOpportunityOrder();
    res.json({ data: { order } });
  } catch (error) {
    console.error("Error fetching next opportunity order:", error);
    res.status(500).json({ error: "Failed to fetch next order" });
  }
});

router.get("/", async (req, res) => {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";
    const rows = await prisma.opportunity.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        client: { select: { id: true, name: true, status: true } },
      },
    });
    res.json({ data: rows.map(serializeOpportunity) });
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (req.params.id === "next-order") {
      return res.status(404).json({ error: "Not found" });
    }
    const row = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, name: true, status: true } },
        jobs: {
          select: {
            id: true,
            title: true,
            referenceNumber: true,
            published: true,
            type: true,
            order: true,
          },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    const { jobs, ...rest } = row;
    res.json({
      data: {
        ...serializeOpportunity(rest),
        jobs: jobs.map((job) => ({
          id: job.id,
          title: job.title,
          referenceNumber: job.referenceNumber,
          published: job.published,
          type: job.type,
          order: job.order,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = opportunitySchema.parse(req.body);
    await ensureOpportunityClient(data.clientId);
    const order = data.order && data.order > 0 ? data.order : await allocateNextOpportunityOrder();

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.opportunity.create({
        data: {
          name: data.name,
          clientId: data.clientId,
          currency: data.currency,
          amount: data.amount,
          status: data.status,
          comments: data.comments ?? "",
          order,
        },
        include: {
          client: { select: { id: true, name: true, status: true } },
        },
      });
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

    if (data.clientId) {
      await ensureOpportunityClient(data.clientId);
    }

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.opportunity.update({
        where: { id: req.params.id },
        data,
        include: {
          client: { select: { id: true, name: true, status: true } },
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
    console.error("Error updating opportunity:", error);
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
      select: { clientId: true },
    });
    if (!opportunity) {
      return res.status(404).json({ error: "Not found" });
    }

    const jobs = await prisma.jobListing.findMany({
      where: {
        clientId: opportunity.clientId,
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
      select: { id: true, clientId: true, opportunityId: true, title: true, referenceNumber: true, published: true, type: true, order: true },
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
      },
    });

    res.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
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
