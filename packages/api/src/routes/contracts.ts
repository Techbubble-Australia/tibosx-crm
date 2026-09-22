import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, type Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  CONTRACT_UNITS,
  type ContractType,
} from "../lib/contract-types";
import {
  CONTRACT_ACTIVE_STATUSES,
  CONTRACT_INACTIVE_STATUSES,
  CONTRACT_MOVE_TO_DRAFT_REASONS,
  CONTRACT_MOVE_TO_DRAFT_REASON_LABELS,
} from "../lib/contract-groups";
import {
  CONTRACT_FIELD_LABELS,
  contractSnapshotFromRow,
  logContractFieldChanges,
  logContractStatusChange,
} from "../lib/contract-activity";
import { CONTRACT_INVOICE_STATUSES } from "../lib/contract-invoice-status";
import { isDateInMonth, resolveContractExpiryDate as resolveExpiryForForecast } from "../lib/sales-forecast";

const router: IRouter = Router();

const decimalField = z.coerce.number().nonnegative();
const optionalDecimalField = z.coerce.number().nonnegative().optional();

const contractBaseSchema = z.object({
  title: z.string().min(1).max(200),
  clientId: z.string().min(1),
  type: z.enum(CONTRACT_TYPES),
  startDate: z.coerce.date(),
  endDate: z
    .preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.union([z.coerce.date(), z.null()]))
    .optional(),
  unit: z.enum(CONTRACT_UNITS).optional().nullable(),
  numberOfUnits: z.coerce.number().int().positive().optional().nullable(),
  currency: z.string().min(1).max(8),
  rate: optionalDecimalField,
  contractValue: optionalDecimalField,
  comments: z.string().max(10000).optional().default(""),
  fileUrls: z.array(z.string().min(1)).optional().default([]),
  ownerId: z.string().optional().nullable(),
});

const variationSchema = z.object({
  variationDate: z.coerce.date(),
  variationEndDate: z
    .preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.union([z.coerce.date(), z.null()]))
    .optional(),
  variationValue: decimalField,
  comments: z.string().max(5000).optional().default(""),
});

const milestoneSchema = z.object({
  description: z.string().min(1).max(5000),
  milestoneDate: z.coerce.date(),
  amount: decimalField,
});

const invoiceSchema = z.object({
  reference: z.string().max(200).optional().default(""),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  status: z.enum(CONTRACT_INVOICE_STATUSES).default("DRAFT"),
  currency: z.string().min(1).max(8).optional(),
  description: z.string().min(1).max(10000),
  qty: z.coerce.number().int().positive(),
  rate: decimalField,
  taxRate: z.coerce.number().nonnegative().default(10),
  fileUrl: z.string().min(1).optional().nullable(),
});

const fileUrlsSchema = z.object({
  fileUrls: z.array(z.string().min(1)),
});

const invoiceStatusSchema = z.object({
  status: z.enum(CONTRACT_INVOICE_STATUSES),
});

const moveToDraftSchema = z
  .object({
    reason: z.enum(CONTRACT_MOVE_TO_DRAFT_REASONS),
    otherReason: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reason === "OTHER" && !data.otherReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Other reason is required when reason is Other",
        path: ["otherReason"],
      });
    }
  });

function toNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

function computeRemaining(contractValue: number, totalVariation: number, consumed: number): number {
  return contractValue - totalVariation - consumed;
}

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isValidEndDate(endDate: Date | null | undefined): boolean {
  if (!endDate) return false;
  return endDate.getUTCFullYear() >= 1971;
}

function normalizeEndDate(endDate: Date | null | undefined): Date | null {
  if (!endDate || !isValidEndDate(endDate)) return null;
  return endDate;
}

function isPastEndDate(endDate: Date): boolean {
  if (!isValidEndDate(endDate)) return false;
  const end = startOfUtcDay(endDate);
  const today = startOfUtcDay();
  return today > end;
}

function resolveContractExpiryDate(contract: {
  endDate: Date | null;
  variations: Array<{ variationEndDate: Date | null; variationDate: Date }>;
}): Date | null {
  const withEnd = contract.variations
    .filter((row) => row.variationEndDate && isValidEndDate(row.variationEndDate))
    .sort((a, b) => b.variationEndDate!.getTime() - a.variationEndDate!.getTime());
  if (withEnd.length > 0) {
    return withEnd[0]!.variationEndDate;
  }
  return normalizeEndDate(contract.endDate);
}

type ResolvedFinancials = {
  unit: string | null;
  numberOfUnits: number | null;
  rate: number;
  contractValue: number;
};

function resolveContractFinancials(
  type: ContractType,
  data: {
    unit?: string | null;
    numberOfUnits?: number | null;
    rate?: number;
    contractValue?: number;
  },
): ResolvedFinancials {
  if (type === "T_AND_M") {
    if (!data.unit) throw new Error("UNIT_REQUIRED");
    if (!data.numberOfUnits || data.numberOfUnits <= 0) throw new Error("NUMBER_OF_UNITS_REQUIRED");
    if (data.rate == null || data.rate < 0) throw new Error("RATE_REQUIRED");
    return {
      unit: data.unit,
      numberOfUnits: data.numberOfUnits,
      rate: data.rate,
      contractValue: data.numberOfUnits * data.rate,
    };
  }
  if (type === "FIXED_PRICE") {
    if (data.contractValue == null || data.contractValue < 0) throw new Error("CONTRACT_VALUE_REQUIRED");
    return {
      unit: null,
      numberOfUnits: null,
      rate: 0,
      contractValue: data.contractValue,
    };
  }
  return {
    unit: null,
    numberOfUnits: null,
    rate: data.rate ?? 0,
    contractValue: data.contractValue ?? 0,
  };
}

async function expirePastDueContracts(): Promise<void> {
  const candidates = await prisma.contract.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      endDate: true,
      variations: {
        select: { variationEndDate: true, variationDate: true },
      },
    },
  });

  const toExpire = candidates.filter((row) => {
    const expiryDate = resolveContractExpiryDate(row);
    return expiryDate && isPastEndDate(expiryDate);
  });
  if (toExpire.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const row of toExpire) {
      await tx.contract.update({
        where: { id: row.id },
        data: { status: "EXPIRED" },
      });
      await logContractStatusChange(tx, row.id, "AUTO_EXPIRED", "ACTIVE", "EXPIRED", null);
    }
  });
}

async function allocateContractNumber(): Promise<string> {
  const rows = await prisma.contract.findMany({
    select: { contractNumber: true },
  });
  let max = 0;
  for (const row of rows) {
    const match = row.contractNumber.match(/^CON(\d+)$/i);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
    }
  }
  return `CON${String(max + 1).padStart(3, "0")}`;
}

async function ensureContractClient(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("CLIENT_NOT_FOUND");
  return client;
}

async function ensureContractOwner(ownerId: string | null | undefined) {
  if (!ownerId) return;
  const owner = await prisma.adminUser.findFirst({
    where: { id: ownerId, active: true },
  });
  if (!owner) throw new Error("OWNER_NOT_FOUND");
}

async function allocateInvoiceNumber(): Promise<string> {
  const rows = await prisma.contractInvoice.findMany({
    select: { invoiceNumber: true },
  });
  let max = 0;
  for (const row of rows) {
    const match = row.invoiceNumber.match(/^INV-(\d+)$/i);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
    }
  }
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

function computeInvoiceAmounts(qty: number, rate: number, taxRate: number) {
  const amount = qty * rate;
  const taxAmount = amount * (taxRate / 100);
  const totalAmount = amount + taxAmount;
  return { amount, taxAmount, totalAmount };
}

function serializeActivityLog(row: {
  id: string;
  contractId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  otherReason: string | null;
  createdAt: Date;
  performedBy?: { id: string; name: string | null; email: string } | null;
}) {
  const reasonLabel =
    row.reason && row.reason in CONTRACT_MOVE_TO_DRAFT_REASON_LABELS
      ? CONTRACT_MOVE_TO_DRAFT_REASON_LABELS[row.reason as keyof typeof CONTRACT_MOVE_TO_DRAFT_REASON_LABELS]
      : row.reason;
  const fieldLabel = row.fieldName ? CONTRACT_FIELD_LABELS[row.fieldName] ?? row.fieldName : null;
  return {
    id: row.id,
    contractId: row.contractId,
    action: row.action,
    fieldName: row.fieldName,
    fieldLabel,
    oldValue: row.oldValue,
    newValue: row.newValue,
    reason: row.reason,
    reasonLabel,
    otherReason: row.otherReason,
    performedById: row.performedBy?.id ?? null,
    performedByName: row.performedBy?.name || row.performedBy?.email || "",
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeVariation(row: {
  id: string;
  contractId: string;
  variationDate: Date;
  variationEndDate: Date | null;
  comments: string;
  unit: string | null;
  rate: { toString(): string } | number | null;
  variationValue: { toString(): string } | number;
  createdAt: Date;
}) {
  return {
    id: row.id,
    contractId: row.contractId,
    variationDate: row.variationDate.toISOString(),
    variationEndDate: row.variationEndDate?.toISOString() ?? null,
    comments: row.comments,
    unit: row.unit,
    rate: row.rate == null ? null : toNumber(row.rate),
    variationValue: toNumber(row.variationValue),
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeMilestone(row: {
  id: string;
  contractId: string;
  description: string;
  milestoneDate: Date;
  amount: { toString(): string } | number;
  createdAt: Date;
}) {
  return {
    id: row.id,
    contractId: row.contractId,
    description: row.description,
    milestoneDate: row.milestoneDate.toISOString(),
    amount: toNumber(row.amount),
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeInvoice(row: {
  id: string;
  contractId: string;
  invoiceNumber: string;
  reference: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  currency: string;
  description: string;
  qty: number;
  rate: { toString(): string } | number;
  amount: { toString(): string } | number;
  taxRate: { toString(): string } | number;
  taxAmount: { toString(): string } | number;
  totalAmount: { toString(): string } | number;
  fileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    contractId: row.contractId,
    invoiceNumber: row.invoiceNumber,
    reference: row.reference,
    issueDate: row.issueDate.toISOString(),
    dueDate: row.dueDate.toISOString(),
    status: row.status,
    currency: row.currency,
    description: row.description,
    qty: row.qty,
    rate: toNumber(row.rate),
    amount: toNumber(row.amount),
    taxRate: toNumber(row.taxRate),
    taxAmount: toNumber(row.taxAmount),
    totalAmount: toNumber(row.totalAmount),
    fileUrl: row.fileUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeContract(row: {
  id: string;
  contractNumber: string;
  title: string;
  clientId: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  unit: string | null;
  numberOfUnits: number | null;
  currency: string;
  rate: { toString(): string } | number;
  contractValue: { toString(): string } | number;
  totalVariation: { toString(): string } | number;
  consumed: { toString(): string } | number;
  comments: string;
  fileUrls: unknown;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: { id: string; name: string } | null;
  owner?: { id: string; name: string | null; email: string } | null;
    variations?: Array<{
    id: string;
    contractId: string;
    variationDate: Date;
    variationEndDate: Date | null;
    comments: string;
    unit: string | null;
    rate: { toString(): string } | number | null;
    variationValue: { toString(): string } | number;
    createdAt: Date;
  }>;
  milestones?: Array<{
    id: string;
    contractId: string;
    description: string;
    milestoneDate: Date;
    amount: { toString(): string } | number;
    createdAt: Date;
  }>;
  invoices?: Array<{
    id: string;
    contractId: string;
    invoiceNumber: string;
    reference: string;
    issueDate: Date;
    dueDate: Date;
    status: string;
    currency: string;
    description: string;
    qty: number;
    rate: { toString(): string } | number;
    amount: { toString(): string } | number;
    taxRate: { toString(): string } | number;
    taxAmount: { toString(): string } | number;
    totalAmount: { toString(): string } | number;
    fileUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  activityLogs?: Array<{
    id: string;
    contractId: string;
    action: string;
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
    reason: string | null;
    otherReason: string | null;
    createdAt: Date;
    performedBy?: { id: string; name: string | null; email: string } | null;
  }>;
}) {
  const type = row.type as keyof typeof CONTRACT_TYPE_LABELS;
  const contractValue = toNumber(row.contractValue);
  const totalVariation = toNumber(row.totalVariation);
  const consumed = toNumber(row.consumed);
  const fileUrls = Array.isArray(row.fileUrls)
    ? row.fileUrls.filter((url): url is string => typeof url === "string")
    : [];

  return {
    id: row.id,
    contractNumber: row.contractNumber,
    title: row.title,
    clientId: row.clientId,
    clientName: row.client?.name ?? "",
    type: row.type,
    typeLabel: CONTRACT_TYPE_LABELS[type] ?? row.type,
    status: row.status,
    startDate: row.startDate.toISOString(),
    endDate: normalizeEndDate(row.endDate)?.toISOString() ?? null,
    unit: row.unit,
    numberOfUnits: row.numberOfUnits,
    currency: row.currency,
    rate: toNumber(row.rate),
    contractValue,
    totalVariation,
    consumed,
    remaining: computeRemaining(contractValue, totalVariation, consumed),
    comments: row.comments,
    fileUrls,
    ownerId: row.ownerId,
    ownerName: row.owner?.name || row.owner?.email || "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    variations: row.variations?.map(serializeVariation) ?? undefined,
    milestones: row.milestones?.map(serializeMilestone) ?? undefined,
    invoices: row.invoices?.map(serializeInvoice) ?? undefined,
    activityLogs: row.activityLogs?.map(serializeActivityLog) ?? undefined,
  };
}

const contractInclude = {
  client: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, email: true } },
};

const activityInclude = {
  performedBy: { select: { id: true, name: true, email: true } },
};

const detailInclude = {
  ...contractInclude,
  variations: { orderBy: { variationDate: "desc" as const } },
  milestones: { orderBy: { milestoneDate: "asc" as const } },
  invoices: { orderBy: { issueDate: "desc" as const } },
  activityLogs: {
    orderBy: { createdAt: "desc" as const },
    include: activityInclude,
  },
};

async function fetchContractDetail(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: detailInclude,
  });
}

router.get("/", async (req, res) => {
  try {
    await expirePastDueContracts();
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";
    const tab = typeof req.query.tab === "string" ? req.query.tab.trim() : "";
    const expiring = typeof req.query.expiring === "string" ? req.query.expiring.trim() : "";
    const where: Prisma.ContractWhereInput = {};
    if (clientId) where.clientId = clientId;
    if (tab === "active") {
      where.status = { in: [...CONTRACT_ACTIVE_STATUSES] };
    } else if (tab === "inactive") {
      where.status = { in: [...CONTRACT_INACTIVE_STATUSES] };
    }
    if (expiring) {
      where.status = "ACTIVE";
    }
    const rows = await prisma.contract.findMany({
      where,
      include: expiring
        ? {
            ...contractInclude,
            variations: { select: { variationEndDate: true } },
          }
        : contractInclude,
      orderBy: [{ createdAt: "desc" }],
    });
    const now = new Date();
    const year = now.getUTCFullYear();
    const thisMonth = now.getUTCMonth();
    const nextMonth = thisMonth === 11 ? 0 : thisMonth + 1;
    const nextMonthYear = thisMonth === 11 ? year + 1 : year;
    const filtered = expiring
      ? rows.filter((row) => {
          const variations =
            "variations" in row && Array.isArray(row.variations)
              ? (row.variations as Array<{ variationEndDate: Date | null }>)
              : [];
          const expiry = resolveExpiryForForecast(row.endDate, variations);
          if (!expiry) return false;
          if (expiring === "thisMonth") return isDateInMonth(expiry, year, thisMonth);
          if (expiring === "nextMonth") return isDateInMonth(expiry, nextMonthYear, nextMonth);
          return true;
        })
      : rows;
    res.json({ data: filtered.map(serializeContract) });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({ error: "Failed to fetch contracts" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    await expirePastDueContracts();
    const row = await fetchContractDetail(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeContract(row) });
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(500).json({ error: "Failed to fetch contract" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const data = contractBaseSchema.parse(req.body);
    const financials = resolveContractFinancials(data.type, data);
    await ensureContractClient(data.clientId);
    const ownerId = data.ownerId ?? req.user?.id ?? null;
    await ensureContractOwner(ownerId);
    const contractNumber = await allocateContractNumber();

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.contract.create({
        data: {
          contractNumber,
          title: data.title,
          clientId: data.clientId,
          type: data.type,
          status: "DRAFT",
          startDate: data.startDate,
          endDate: normalizeEndDate(data.endDate ?? null),
          unit: financials.unit,
          numberOfUnits: financials.numberOfUnits,
          currency: data.currency,
          rate: financials.rate,
          contractValue: financials.contractValue,
          comments: data.comments ?? "",
          fileUrls: data.fileUrls ?? [],
          ownerId,
        },
        include: contractInclude,
      });
      await tx.contractActivityLog.create({
        data: {
          contractId: created.id,
          action: "CREATED",
          performedById: req.user?.id ?? null,
        },
      });
      const logs = await tx.contractActivityLog.findMany({
        where: { contractId: created.id },
        orderBy: { createdAt: "desc" },
        include: activityInclude,
      });
      return { ...created, activityLogs: logs };
    });

    res.status(201).json({ data: serializeContract(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
      return res.status(400).json({ error: "Client not found" });
    }
    if (error instanceof Error && error.message === "OWNER_NOT_FOUND") {
      return res.status(400).json({ error: "Contract owner not found" });
    }
    if (error instanceof Error && error.message === "UNIT_REQUIRED") {
      return res.status(400).json({ error: "Unit is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "NUMBER_OF_UNITS_REQUIRED") {
      return res.status(400).json({ error: "No. of units is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "RATE_REQUIRED") {
      return res.status(400).json({ error: "Rate is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "CONTRACT_VALUE_REQUIRED") {
      return res.status(400).json({ error: "Contract value is required for fixed price contracts" });
    }
    console.error("Error creating contract:", error);
    res.status(500).json({ error: "Failed to create contract" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const data = contractBaseSchema.partial().parse(req.body);
    const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.status !== "DRAFT") {
      return res.status(400).json({ error: "Contract can only be edited in Draft status" });
    }

    const nextType = (data.type ?? existing.type) as ContractType;
    const financials = resolveContractFinancials(nextType, {
      unit: data.unit !== undefined ? data.unit : existing.unit,
      numberOfUnits:
        data.numberOfUnits !== undefined ? data.numberOfUnits : existing.numberOfUnits,
      rate: data.rate !== undefined ? data.rate : toNumber(existing.rate),
      contractValue:
        data.contractValue !== undefined ? data.contractValue : toNumber(existing.contractValue),
    });

    const merged = {
      title: data.title ?? existing.title,
      clientId: data.clientId ?? existing.clientId,
      type: nextType,
      status: existing.status,
      startDate: data.startDate ?? existing.startDate,
      endDate:
        data.endDate !== undefined
          ? normalizeEndDate(data.endDate)
          : normalizeEndDate(existing.endDate),
      unit: financials.unit,
      numberOfUnits: financials.numberOfUnits,
      currency: data.currency ?? existing.currency,
      rate: financials.rate,
      contractValue: financials.contractValue,
      consumed: toNumber(existing.consumed),
      comments: data.comments ?? existing.comments,
      fileUrls:
        data.fileUrls ??
        (Array.isArray(existing.fileUrls)
          ? existing.fileUrls.filter((url): url is string => typeof url === "string")
          : []),
      ownerId: existing.ownerId,
    };

    if (data.ownerId !== undefined) {
      await ensureContractOwner(data.ownerId);
      merged.ownerId = data.ownerId;
    }

    if (data.clientId) await ensureContractClient(data.clientId);

    const beforeSnapshot = contractSnapshotFromRow(existing);

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id: req.params.id },
        data: {
          title: merged.title,
          clientId: merged.clientId,
          type: merged.type,
          startDate: merged.startDate,
          endDate: merged.endDate,
          unit: merged.unit,
          numberOfUnits: merged.numberOfUnits,
          currency: merged.currency,
          rate: merged.rate,
          contractValue: merged.contractValue,
          comments: merged.comments,
          fileUrls: merged.fileUrls,
          ownerId: merged.ownerId,
        },
        include: contractInclude,
      });
      await logContractFieldChanges(
        tx,
        existing.id,
        beforeSnapshot,
        contractSnapshotFromRow(updated),
        req.user?.id,
      );
      const logs = await tx.contractActivityLog.findMany({
        where: { contractId: existing.id },
        orderBy: { createdAt: "desc" },
        include: activityInclude,
      });
      return { ...updated, variations: [], activityLogs: logs };
    });

    const detail = await fetchContractDetail(row.id);
    res.json({ data: serializeContract(detail ?? row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
      return res.status(400).json({ error: "Client not found" });
    }
    if (error instanceof Error && error.message === "OWNER_NOT_FOUND") {
      return res.status(400).json({ error: "Contract owner not found" });
    }
    if (error instanceof Error && error.message === "UNIT_REQUIRED") {
      return res.status(400).json({ error: "Unit is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "NUMBER_OF_UNITS_REQUIRED") {
      return res.status(400).json({ error: "No. of units is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "RATE_REQUIRED") {
      return res.status(400).json({ error: "Rate is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "CONTRACT_VALUE_REQUIRED") {
      return res.status(400).json({ error: "Contract value is required for fixed price contracts" });
    }
    console.error("Error updating contract:", error);
    res.status(500).json({ error: "Failed to update contract" });
  }
});

router.post("/:id/activate", async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.status !== "DRAFT") {
      return res.status(400).json({ error: "Only draft contracts can be activated" });
    }

    resolveContractFinancials(existing.type as ContractType, {
      unit: existing.unit,
      numberOfUnits: existing.numberOfUnits,
      rate: toNumber(existing.rate),
      contractValue: toNumber(existing.contractValue),
    });

    await prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: existing.id },
        data: { status: "ACTIVE" },
      });
      await logContractStatusChange(
        tx,
        existing.id,
        "ACTIVATED",
        "DRAFT",
        "ACTIVE",
        req.user?.id,
      );
    });

    const row = await fetchContractDetail(existing.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeContract(row) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNIT_REQUIRED") {
      return res.status(400).json({ error: "Unit is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "NUMBER_OF_UNITS_REQUIRED") {
      return res.status(400).json({ error: "No. of units is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "RATE_REQUIRED") {
      return res.status(400).json({ error: "Rate is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "CONTRACT_VALUE_REQUIRED") {
      return res.status(400).json({ error: "Contract value is required for fixed price contracts" });
    }
    console.error("Error activating contract:", error);
    res.status(500).json({ error: "Failed to activate contract" });
  }
});

router.post("/:id/terminate", async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.status !== "ACTIVE") {
      return res.status(400).json({ error: "Only active contracts can be terminated" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: existing.id },
        data: { status: "CANCELED" },
      });
      await logContractStatusChange(
        tx,
        existing.id,
        "TERMINATED",
        "ACTIVE",
        "CANCELED",
        req.user?.id,
      );
    });

    const row = await fetchContractDetail(existing.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeContract(row) });
  } catch (error) {
    console.error("Error terminating contract:", error);
    res.status(500).json({ error: "Failed to terminate contract" });
  }
});

router.post("/:id/move-to-draft", async (req: AuthRequest, res) => {
  try {
    const body = moveToDraftSchema.parse(req.body);
    const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.status === "DRAFT") {
      return res.status(400).json({ error: "Contract is already in Draft status" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: existing.id },
        data: { status: "DRAFT" },
      });
      await logContractStatusChange(
        tx,
        existing.id,
        "MOVE_TO_DRAFT",
        existing.status,
        "DRAFT",
        req.user?.id,
        {
          reason: body.reason,
          otherReason: body.reason === "OTHER" ? body.otherReason?.trim() ?? null : null,
        },
      );
    });

    const row = await fetchContractDetail(existing.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeContract(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error moving contract to draft:", error);
    res.status(500).json({ error: "Failed to move contract to draft" });
  }
});

router.patch("/:id/files", async (req, res) => {
  try {
    const body = fileUrlsSchema.parse(req.body);
    const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.status === "CANCELED") {
      return res.status(400).json({ error: "Files cannot be updated on canceled contracts" });
    }

    await prisma.contract.update({
      where: { id: existing.id },
      data: { fileUrls: body.fileUrls },
    });

    const row = await fetchContractDetail(existing.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeContract(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating contract files:", error);
    res.status(500).json({ error: "Failed to update contract files" });
  }
});

router.post("/:id/milestones", async (req, res) => {
  try {
    const input = milestoneSchema.parse(req.body);
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contract) return res.status(404).json({ error: "Not found" });
    if (contract.status !== "ACTIVE") {
      return res.status(400).json({ error: "Milestones can only be added to active contracts" });
    }
    if (contract.type === "T_AND_M") {
      return res.status(400).json({ error: "Milestones are not used for T&M contracts" });
    }

    const row = await prisma.contractMilestone.create({
      data: {
        contractId: contract.id,
        description: input.description.trim(),
        milestoneDate: input.milestoneDate,
        amount: input.amount,
      },
    });

    res.status(201).json({ data: serializeMilestone(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error adding contract milestone:", error);
    res.status(500).json({ error: "Failed to add milestone" });
  }
});

router.post("/:id/variations", async (req, res) => {
  try {
    const input = variationSchema.parse(req.body);
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contract) return res.status(404).json({ error: "Not found" });
    if (contract.status !== "ACTIVE") {
      return res.status(400).json({ error: "Variations can only be added to active contracts" });
    }
    if (contract.type === "T_AND_M" && !input.variationEndDate) {
      return res.status(400).json({ error: "Variation end date is required for T&M contracts" });
    }

    const variationValue = input.variationValue;

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.contractVariation.create({
        data: {
          contractId: contract.id,
          variationDate: input.variationDate,
          variationEndDate: normalizeEndDate(input.variationEndDate ?? null),
          comments: input.comments?.trim() ?? "",
          variationValue,
        },
      });
      const nextTotal = toNumber(contract.totalVariation) + variationValue;
      await tx.contract.update({
        where: { id: contract.id },
        data: { totalVariation: nextTotal },
      });
      return created;
    });

    res.status(201).json({ data: serializeVariation(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error adding contract variation:", error);
    res.status(500).json({ error: "Failed to add variation" });
  }
});

router.post("/:id/invoices", async (req, res) => {
  try {
    const input = invoiceSchema.parse(req.body);
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contract) return res.status(404).json({ error: "Not found" });
    if (contract.status !== "ACTIVE") {
      return res.status(400).json({ error: "Invoices can only be added to active contracts" });
    }

    const invoiceNumber = await allocateInvoiceNumber();
    const { amount, taxAmount, totalAmount } = computeInvoiceAmounts(
      input.qty,
      input.rate,
      input.taxRate,
    );

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.contractInvoice.create({
        data: {
          contractId: contract.id,
          invoiceNumber,
          reference: input.reference ?? "",
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          status: input.status,
          currency: input.currency ?? contract.currency,
          description: input.description.trim(),
          qty: input.qty,
          rate: input.rate,
          amount,
          taxRate: input.taxRate,
          taxAmount,
          totalAmount,
          fileUrl: input.fileUrl ?? null,
        },
      });
      const nextConsumed = toNumber(contract.consumed) + totalAmount;
      await tx.contract.update({
        where: { id: contract.id },
        data: { consumed: nextConsumed },
      });
      return created;
    });

    res.status(201).json({ data: serializeInvoice(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error adding contract invoice:", error);
    res.status(500).json({ error: "Failed to add invoice" });
  }
});

router.patch("/:id/invoices/:invoiceId", async (req, res) => {
  try {
    const body = invoiceStatusSchema.parse(req.body);
    const invoice = await prisma.contractInvoice.findFirst({
      where: { id: req.params.invoiceId, contractId: req.params.id },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const row = await prisma.contractInvoice.update({
      where: { id: invoice.id },
      data: { status: body.status },
    });

    res.json({ data: serializeInvoice(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating contract invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.contract.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting contract:", error);
    res.status(500).json({ error: "Failed to delete contract" });
  }
});

export { router as contractRoutes };
