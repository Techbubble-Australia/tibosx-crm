import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

const lineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1).max(500),
  qty: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  order: z.number().int().optional(),
});

const quoteSchema = z.object({
  title: z.string().min(1).max(200),
  clientId: z.string().min(1),
  opportunityId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  currency: z.string().max(8).default("AUD"),
  taxRate: z.coerce.number().min(0).max(100).default(10),
  validUntil: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().default(""),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
  lines: z.array(lineSchema).min(1),
});

function money(n: number) {
  return Math.round(n * 100) / 100;
}

async function nextQuoteNumber(tenantId: string) {
  const count = await prisma.quote.count({ where: { tenantId } });
  return `Q-${String(count + 1).padStart(5, "0")}`;
}

function serializeQuote(row: any) {
  return {
    id: row.id,
    quoteNumber: row.quoteNumber,
    title: row.title,
    status: row.status,
    clientId: row.clientId,
    client: row.client ? { id: row.client.id, name: row.client.name } : null,
    opportunityId: row.opportunityId,
    opportunity: row.opportunity
      ? { id: row.opportunity.id, name: row.opportunity.name }
      : null,
    ownerId: row.ownerId,
    owner: row.owner
      ? { id: row.owner.id, name: row.owner.name, email: row.owner.email }
      : null,
    currency: row.currency,
    subtotal: Number(row.subtotal),
    taxRate: Number(row.taxRate),
    taxAmount: Number(row.taxAmount),
    totalAmount: Number(row.totalAmount),
    validUntil: row.validUntil,
    notes: row.notes,
    lines: (row.lines ?? []).map((l: any) => ({
      id: l.id,
      productId: l.productId,
      description: l.description,
      qty: Number(l.qty),
      unitPrice: Number(l.unitPrice),
      amount: Number(l.amount),
      order: l.order,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const includeQuote = {
  client: { select: { id: true, name: true } },
  opportunity: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, email: true } },
  lines: { orderBy: { order: "asc" as const } },
};

router.get("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const opportunityId =
    typeof req.query.opportunityId === "string" ? req.query.opportunityId : undefined;
  const quotes = await prisma.quote.findMany({
    where: {
      tenantId,
      ...(opportunityId ? { opportunityId } : {}),
    },
    include: includeQuote,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return res.json({ data: quotes.map(serializeQuote) });
});

/** Minimal products list for quote line picker. */
router.get("/meta/products", async (req: AuthRequest, res) => {
  const products = await prisma.product.findMany({
    where: { tenantId: req.tenant!.tenantId, active: true },
    orderBy: { name: "asc" },
  });
  return res.json({
    data: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unitPrice: Number(p.unitPrice),
      currency: p.currency,
      unit: p.unit,
    })),
  });
});

router.post("/meta/products", async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1).max(200),
    sku: z.string().max(80).optional().nullable(),
    description: z.string().max(2000).optional().default(""),
    unit: z.string().max(40).default("unit"),
    unitPrice: z.coerce.number().nonnegative(),
    currency: z.string().max(8).default("AUD"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const product = await prisma.product.create({
    data: {
      tenantId: req.tenant!.tenantId,
      ...parsed.data,
      sku: parsed.data.sku ?? null,
    },
  });
  return res.status(201).json({ data: product });
});

router.get("/:id", async (req: AuthRequest, res) => {
  const quote = await prisma.quote.findFirst({
    where: { id: req.params.id, tenantId: req.tenant!.tenantId },
    include: includeQuote,
  });
  if (!quote) return res.status(404).json({ error: "Quote not found" });
  return res.json({ data: serializeQuote(quote) });
});

router.post("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, tenantId },
  });
  if (!client) return res.status(400).json({ error: "Client not found" });

  const lines = parsed.data.lines.map((l, i) => {
    const amount = money(l.qty * l.unitPrice);
    return {
      productId: l.productId ?? null,
      description: l.description,
      qty: l.qty,
      unitPrice: l.unitPrice,
      amount,
      order: l.order ?? i,
    };
  });
  const subtotal = money(lines.reduce((s, l) => s + l.amount, 0));
  const taxAmount = money(subtotal * (parsed.data.taxRate / 100));
  const totalAmount = money(subtotal + taxAmount);

  const quote = await prisma.quote.create({
    data: {
      tenantId,
      quoteNumber: await nextQuoteNumber(tenantId),
      title: parsed.data.title,
      status: parsed.data.status ?? "DRAFT",
      clientId: parsed.data.clientId,
      opportunityId: parsed.data.opportunityId ?? null,
      ownerId: parsed.data.ownerId ?? req.user?.id ?? null,
      currency: parsed.data.currency,
      taxRate: parsed.data.taxRate,
      subtotal,
      taxAmount,
      totalAmount,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
      notes: parsed.data.notes ?? "",
      lines: { create: lines },
    },
    include: includeQuote,
  });
  return res.status(201).json({ data: serializeQuote(quote) });
});

router.put("/:id", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const existing = await prisma.quote.findFirst({
    where: { id: req.params.id, tenantId },
  });
  if (!existing) return res.status(404).json({ error: "Quote not found" });
  const parsed = quoteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let moneyFields: {
    subtotal?: number;
    taxAmount?: number;
    totalAmount?: number;
  } = {};

  if (parsed.data.lines) {
    const lines = parsed.data.lines.map((l, i) => {
      const amount = money(l.qty * l.unitPrice);
      return {
        productId: l.productId ?? null,
        description: l.description,
        qty: l.qty,
        unitPrice: l.unitPrice,
        amount,
        order: l.order ?? i,
      };
    });
    const taxRate = parsed.data.taxRate ?? Number(existing.taxRate);
    const subtotal = money(lines.reduce((s, l) => s + l.amount, 0));
    const taxAmount = money(subtotal * (taxRate / 100));
    const totalAmount = money(subtotal + taxAmount);
    moneyFields = { subtotal, taxAmount, totalAmount };
    await prisma.quoteLine.deleteMany({ where: { quoteId: existing.id } });
    await prisma.quoteLine.createMany({
      data: lines.map((l) => ({ ...l, quoteId: existing.id })),
    });
  }

  const quote = await prisma.quote.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title,
      status: parsed.data.status,
      clientId: parsed.data.clientId,
      opportunityId: parsed.data.opportunityId,
      ownerId: parsed.data.ownerId,
      currency: parsed.data.currency,
      taxRate: parsed.data.taxRate,
      notes: parsed.data.notes,
      validUntil:
        parsed.data.validUntil === undefined
          ? undefined
          : parsed.data.validUntil
            ? new Date(parsed.data.validUntil)
            : null,
      ...moneyFields,
    },
    include: includeQuote,
  });
  return res.json({ data: serializeQuote(quote) });
});

/** Accept quote: move linked opportunity toward Verbal yes and optionally draft a contract. */
router.post("/:id/accept", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const quote = await prisma.quote.findFirst({
    where: { id: req.params.id, tenantId },
    include: { client: true },
  });
  if (!quote) return res.status(404).json({ error: "Quote not found" });

  const createContract = Boolean(req.body?.createContract);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.quote.update({
      where: { id: quote.id },
      data: { status: "ACCEPTED" },
      include: includeQuote,
    });

    if (quote.opportunityId) {
      const verbal = await tx.crmStage.findFirst({
        where: {
          name: "Verbal yes",
          pipeline: { tenantId },
        },
      });
      if (verbal) {
        const opp = await tx.opportunity.findUnique({ where: { id: quote.opportunityId } });
        if (opp) {
          await tx.opportunity.update({
            where: { id: opp.id },
            data: {
              stageId: verbal.id,
              pipelineId: verbal.pipelineId,
              probability: verbal.winProbability,
              status: "PROPOSAL",
            },
          });
          await tx.opportunityStageHistory.create({
            data: {
              opportunityId: opp.id,
              fromStageId: opp.stageId,
              toStageId: verbal.id,
              changedById: req.user?.id ?? null,
              note: "Quote accepted",
            },
          });
        }
      }
    }

    let contractId: string | null = null;
    if (createContract) {
      const year = new Date().getFullYear();
      const count = await tx.contract.count();
      const contractNumber = `C-${year}-${String(count + 1).padStart(4, "0")}`;
      const contract = await tx.contract.create({
        data: {
          tenantId,
          contractNumber,
          title: quote.title,
          clientId: quote.clientId,
          opportunityId: quote.opportunityId,
          quoteId: quote.id,
          type: "FIXED_PRICE",
          status: "DRAFT",
          startDate: new Date(),
          currency: quote.currency,
          rate: Number(quote.totalAmount),
          contractValue: Number(quote.totalAmount),
          ownerId: quote.ownerId ?? req.user?.id ?? null,
        },
      });
      contractId = contract.id;
    }

    return { quote: updated, contractId };
  });

  return res.json({
    data: {
      quote: serializeQuote(result.quote),
      contractId: result.contractId,
    },
  });
});

export { router as crmQuoteRoutes };
