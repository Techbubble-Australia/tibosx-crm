import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, Prisma } from "@techbubble/database";
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
  logContractVariationChange,
} from "../lib/contract-activity";
import { CONTRACT_INVOICE_STATUSES } from "../lib/contract-invoice-status";
import { expirePastDueContracts } from "../lib/contract-expiry";
import { isDateInMonth, resolveContractExpiryDate as resolveExpiryForForecast } from "../lib/sales-forecast";
import {
  generateWorkUnitMonths,
  sumWorkUnits,
  type WorkUnitMonthInput,
} from "../lib/contract-work-units";
import { validateContractDates, validateVariationDates } from "../lib/contract-date-rules";
import {
  contractIsIncomplete,
  releaseProfilesForEndedContract,
  syncProfileAvailableFlag,
} from "../lib/contract-profiles";
import { createProjectFromContract } from "../lib/create-project-from-contract";
import { syncProjectBudgetsForContract } from "../lib/project-budget";
import { normalizeContractFileUrls } from "../lib/contract-file-urls";
import { toNumber, toNumberOrNull } from "../lib/decimal";
import {
  invoiceFiles,
  invoiceFileSchema,
  invoiceLineItems,
  invoiceLineItemSchema,
  lineItemsSubtotal,
  type InvoiceLineItem,
} from "../lib/invoice-lines";

const router: IRouter = Router();

router.use(async (_req, _res, next) => {
  try {
    await expirePastDueContracts();
  } catch (error) {
    console.error("Error expiring past-due contracts:", error);
  }
  next();
});

const decimalField = z.coerce.number().nonnegative();
const optionalDecimalField = z.coerce.number().nonnegative().optional();

const qtyField = z.coerce.number().positive();
const qtyFieldOptional = z.coerce.number().positive().optional();

const workUnitMonthSchema = z.object({
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(0).max(11),
  workUnits: qtyField,
});

const contractCreateSchema = z.object({
  careerApplicationId: z.string().optional(),
});

const contractBaseSchema = z.object({
  title: z.string().min(1).max(200),
  clientId: z.string().min(1),
  type: z.enum(CONTRACT_TYPES),
  startDate: z.coerce.date(),
  endDate: z
    .preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.union([z.coerce.date(), z.null()]))
    .optional(),
  unit: z.enum(CONTRACT_UNITS).optional().nullable(),
  numberOfUnits: qtyFieldOptional.nullable(),
  workUnitMonths: z.array(workUnitMonthSchema).optional(),
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
  variationValue: optionalDecimalField,
  qty: qtyFieldOptional,
  rate: optionalDecimalField,
  workUnitMonths: z.array(workUnitMonthSchema).optional(),
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
  qty: qtyField,
  rate: decimalField,
  taxRate: z.coerce.number().nonnegative().default(10),
  fileUrl: z.string().min(1).optional().nullable(),
  /** When given, the invoice amount is the sum of these lines (qty/rate are then 1 × subtotal). */
  lineItems: z.array(invoiceLineItemSchema).min(1).max(50).optional(),
  fileUrls: z.array(invoiceFileSchema).max(20).optional(),
});

/** Line items win over qty/rate; one line is stored as plain qty/rate. */
function invoicePricing(input: { qty: number; rate: number; lineItems?: InvoiceLineItem[] }) {
  const lines = input.lineItems;
  if (!lines?.length) return { qty: input.qty, rate: input.rate, lineItems: Prisma.DbNull };
  if (lines.length === 1) return { qty: lines[0]!.qty, rate: lines[0]!.rate, lineItems: Prisma.DbNull };
  return { qty: 1, rate: lineItemsSubtotal(lines), lineItems: lines as Prisma.InputJsonValue };
}

const fileUrlsSchema = z.object({
  fileUrls: z.array(z.string().min(1)),
});

const invoiceStatusSchema = z.object({
  status: z.enum(CONTRACT_INVOICE_STATUSES),
});

const invoiceUpdateSchema = invoiceSchema.partial();

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

function computeRemaining(contractValue: number, totalVariation: number, consumed: number): number {
  return contractValue + totalVariation - consumed;
}

async function ensureActiveContract(contractId: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new Error("NOT_FOUND");
  if (contract.status !== "ACTIVE") throw new Error("NOT_ACTIVE");
  return contract;
}

function isInvoiceableContractStatus(status: string): boolean {
  return status === "ACTIVE" || status === "EXPIRED";
}

async function ensureInvoiceableContract(contractId: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new Error("NOT_FOUND");
  if (!isInvoiceableContractStatus(contract.status)) throw new Error("NOT_INVOICEABLE");
  return contract;
}

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function maybeReactivateContractAfterVariation(
  tx: Prisma.TransactionClient,
  contractId: string,
  performedById: string | null | undefined,
): Promise<void> {
  const contract = await tx.contract.findUnique({
    where: { id: contractId },
    select: {
      status: true,
      endDate: true,
      variations: { select: { variationEndDate: true } },
    },
  });
  if (!contract || contract.status !== "EXPIRED") return;
  const expiry = resolveExpiryForForecast(contract.endDate, contract.variations);
  if (!expiry) return;
  const today = startOfUtcDay();
  const expiryDay = startOfUtcDay(expiry);
  if (expiryDay >= today) {
    await tx.contract.update({
      where: { id: contractId },
      data: { status: "ACTIVE" },
    });
    await logContractStatusChange(tx, contractId, "ACTIVATED", "EXPIRED", "ACTIVE", performedById);
  }
}

type VariationInput = {
  variationDate: Date;
  variationEndDate?: Date | null;
  variationValue?: number;
  qty?: number;
  rate?: number;
  workUnitMonths?: WorkUnitMonthInput[];
  comments?: string;
};

async function replaceWorkUnitMonths(
  tx: Prisma.TransactionClient,
  contractId: string,
  segmentKey: string,
  rows: WorkUnitMonthInput[],
) {
  await tx.contractWorkUnitMonth.deleteMany({ where: { contractId, segmentKey } });
  if (!rows.length) return;
  await tx.contractWorkUnitMonth.createMany({
    data: rows.map((row) => ({
      contractId,
      segmentKey,
      year: row.year,
      month: row.month,
      workUnits: row.workUnits,
    })),
  });
}

function resolveTmWorkUnitMonths(
  startDate: Date,
  endDate: Date | null | undefined,
  unit: string,
  provided?: WorkUnitMonthInput[],
): WorkUnitMonthInput[] {
  if (provided?.length) return provided;
  if (!endDate) return [];
  return generateWorkUnitMonths(startDate, endDate, unit).map((row) => ({
    year: row.year,
    month: row.month,
    workUnits: row.workUnits,
  }));
}

function resolveVariationPayload(
  contract: { type: string; unit: string | null },
  input: VariationInput,
) {
  if (contract.type === "T_AND_M") {
    if (!input.variationEndDate) throw new Error("VARIATION_END_REQUIRED");
    if (!contract.unit) throw new Error("UNIT_REQUIRED");
    const workUnitMonths = resolveTmWorkUnitMonths(
      input.variationDate,
      input.variationEndDate,
      contract.unit,
      input.workUnitMonths,
    );
    const qty = workUnitMonths.length ? sumWorkUnits(workUnitMonths) : input.qty;
    if (!qty || qty <= 0) throw new Error("VARIATION_QTY_REQUIRED");
    if (input.rate == null || input.rate < 0) throw new Error("VARIATION_RATE_REQUIRED");
    const variationValue = qty * input.rate;
    return {
      variationDate: input.variationDate,
      variationEndDate: normalizeEndDate(input.variationEndDate),
      comments: input.comments?.trim() ?? "",
      qty,
      rate: input.rate,
      unit: contract.unit,
      variationValue,
      workUnitMonths,
    };
  }
  if (input.variationValue == null || input.variationValue < 0) {
    throw new Error("VARIATION_VALUE_REQUIRED");
  }
  return {
    variationDate: input.variationDate,
    variationEndDate: normalizeEndDate(input.variationEndDate ?? null),
    comments: input.comments?.trim() ?? "",
    qty: null,
    rate: null,
    unit: null,
    variationValue: input.variationValue,
  };
}

async function syncContractTotalVariation(tx: Prisma.TransactionClient, contractId: string) {
  const agg = await tx.contractVariation.aggregate({
    where: { contractId },
    _sum: { variationValue: true },
  });
  const total = agg._sum.variationValue == null ? 0 : toNumber(agg._sum.variationValue);
  await tx.contract.update({
    where: { id: contractId },
    data: { totalVariation: total },
  });
  return total;
}

async function syncContractConsumed(tx: Prisma.TransactionClient, contractId: string) {
  const agg = await tx.contractInvoice.aggregate({
    where: { contractId },
    _sum: { amount: true },
  });
  const total = agg._sum.amount == null ? 0 : toNumber(agg._sum.amount);
  await tx.contract.update({
    where: { id: contractId },
    data: { consumed: total },
  });
  return total;
}

function isValidEndDate(endDate: Date | null | undefined): boolean {
  if (!endDate) return false;
  return endDate.getUTCFullYear() >= 1971;
}

function normalizeEndDate(endDate: Date | null | undefined): Date | null {
  if (!endDate || !isValidEndDate(endDate)) return null;
  return endDate;
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
    workUnitMonths?: WorkUnitMonthInput[];
  },
): ResolvedFinancials {
  if (type === "T_AND_M") {
    if (!data.unit) throw new Error("UNIT_REQUIRED");
    const numberOfUnits =
      data.workUnitMonths?.length
        ? sumWorkUnits(data.workUnitMonths)
        : data.numberOfUnits;
    if (!numberOfUnits || numberOfUnits <= 0) throw new Error("NUMBER_OF_UNITS_REQUIRED");
    if (data.rate == null || data.rate < 0) throw new Error("RATE_REQUIRED");
    return {
      unit: data.unit,
      numberOfUnits,
      rate: data.rate,
      contractValue: numberOfUnits * data.rate,
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

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeInvoiceAmounts(qty: number, rate: number, taxRate: number) {
  const amount = roundMoney(qty * rate);
  const taxAmount = roundMoney(amount * (taxRate / 100));
  const totalAmount = roundMoney(amount + taxAmount);
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

function parseDateQuery(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function ensureDraftContract(contractId: string) {
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) throw new Error("NOT_FOUND");
  if (contract.status !== "DRAFT") throw new Error("NOT_DRAFT");
  return contract;
}

function serializeContractProfile(row: {
  id: string;
  profileId: string;
  createdAt: Date;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    category: string;
    technology: string;
    available: boolean;
  };
}) {
  return {
    id: row.id,
    profileId: row.profileId,
    firstName: row.profile.firstName,
    lastName: row.profile.lastName,
    email: row.profile.email,
    phone: row.profile.phone ?? "",
    category: row.profile.category,
    technology: row.profile.technology,
    available: row.profile.available,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeWorkUnitMonth(row: {
  year: number;
  month: number;
  workUnits: { toString(): string } | number;
}) {
  return {
    year: row.year,
    month: row.month,
    workUnits: toNumber(row.workUnits),
  };
}

function serializeVariation(
  row: {
    id: string;
    contractId: string;
    variationDate: Date;
    variationEndDate: Date | null;
    comments: string;
    qty?: { toString(): string } | number | null;
    unit: string | null;
    rate: { toString(): string } | number | null;
    variationValue: { toString(): string } | number;
    createdAt: Date;
  },
  workUnitMonths?: Array<{ year: number; month: number; workUnits: { toString(): string } | number }>,
) {
  return {
    id: row.id,
    contractId: row.contractId,
    variationDate: row.variationDate.toISOString(),
    variationEndDate: row.variationEndDate?.toISOString() ?? null,
    comments: row.comments,
    qty: row.qty == null ? null : toNumber(row.qty),
    unit: row.unit,
    rate: row.rate == null ? null : toNumber(row.rate),
    variationValue: toNumber(row.variationValue),
    workUnitMonths: workUnitMonths?.map(serializeWorkUnitMonth) ?? [],
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
  qty: { toString(): string } | number;
  rate: { toString(): string } | number;
  amount: { toString(): string } | number;
  taxRate: { toString(): string } | number;
  taxAmount: { toString(): string } | number;
  totalAmount: { toString(): string } | number;
  fileUrl: string | null;
  lineItems?: unknown;
  fileUrls?: unknown;
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
    qty: toNumber(row.qty),
    rate: toNumber(row.rate),
    amount: toNumber(row.amount),
    taxRate: toNumber(row.taxRate),
    taxAmount: toNumber(row.taxAmount),
    totalAmount: toNumber(row.totalAmount),
    fileUrl: row.fileUrl,
    lineItems: invoiceLineItems({ ...row, lineItems: row.lineItems ?? null }),
    files: invoiceFiles({ fileUrls: row.fileUrls ?? null, fileUrl: row.fileUrl }),
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
  numberOfUnits: { toString(): string } | number | null;
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
    id?: string;
    contractId?: string;
    variationDate: Date;
    variationEndDate: Date | null;
    comments?: string;
    qty?: { toString(): string } | number | null;
    unit?: string | null;
    rate?: { toString(): string } | number | null;
    variationValue?: { toString(): string } | number;
    createdAt?: Date;
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
    qty: { toString(): string } | number;
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
  workUnitMonths?: Array<{
    segmentKey: string;
    year: number;
    month: number;
    workUnits: { toString(): string } | number;
  }>;
  contractProfiles?: Array<{
    id: string;
    profileId?: string;
    createdAt?: Date;
    profile?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      category: string;
      technology: string;
      available: boolean;
    };
  }>;
  careerApplication?: {
    id: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    status?: string;
    jobListing?: { title: string | null } | null;
  } | null;
}) {
  const type = row.type as keyof typeof CONTRACT_TYPE_LABELS;
  const contractValue = toNumber(row.contractValue);
  const totalVariation = toNumber(row.totalVariation);
  const consumed = toNumber(row.consumed);
  const fileUrls = normalizeContractFileUrls(row.fileUrls);
  const variationRows = row.variations ?? [];
  const { latestVariationStartDate, latestVariationEndDate } = latestVariationDates(variationRows);
  const hasCareerApplication = Boolean(row.careerApplication?.id);
  const fullVariationRows = variationRows.filter(
    (
      v,
    ): v is (typeof variationRows)[number] & {
      id: string;
      contractId: string;
      comments: string;
      unit: string | null;
      rate: { toString(): string } | number | null;
      variationValue: { toString(): string } | number;
      createdAt: Date;
    } =>
      v != null &&
      "variationValue" in v &&
      "id" in v &&
      typeof v.id === "string" &&
      v.createdAt instanceof Date,
  );

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
    numberOfUnits: row.numberOfUnits == null ? null : toNumber(row.numberOfUnits),
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
    workUnitMonths:
      row.workUnitMonths
        ?.filter((w) => w.segmentKey === "base")
        .map(serializeWorkUnitMonth) ?? [],
    latestVariationStartDate,
    latestVariationEndDate,
    variations:
      fullVariationRows.length > 0
        ? fullVariationRows.map((variation) =>
            serializeVariation(
              variation,
              row.workUnitMonths?.filter((w) => w.segmentKey === variation.id),
            ),
          )
        : undefined,
    milestones: row.milestones?.map(serializeMilestone) ?? undefined,
    invoices: row.invoices?.map(serializeInvoice) ?? undefined,
    activityLogs: row.activityLogs?.map(serializeActivityLog) ?? undefined,
    profiles: (row.contractProfiles ?? [])
      .filter(
        (
          entry,
        ): entry is {
          id: string;
          profileId: string;
          createdAt: Date;
          profile: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone?: string;
            category: string;
            technology: string;
            available: boolean;
          };
        } => Boolean(entry.profile),
      )
      .map(serializeContractProfile),
    linkedProjects:
      (row as { projects?: Array<{ id: string; projectNumber: string; contractVariationId: string | null }> })
        .projects?.map((project) => ({
          id: project.id,
          projectNumber: project.projectNumber,
          contractVariationId: project.contractVariationId,
        })) ?? [],
    isIncomplete: contractIsIncomplete(
      row.type,
      fileUrls,
      row.contractProfiles?.length ?? 0,
      hasCareerApplication,
    ),
    careerApplication:
      row.careerApplication && row.careerApplication.firstName && row.careerApplication.lastName
        ? {
            id: row.careerApplication.id,
            firstName: row.careerApplication.firstName,
            lastName: row.careerApplication.lastName,
            position: row.careerApplication.position ?? "",
            status: row.careerApplication.status ?? "",
            jobTitle: row.careerApplication.jobListing?.title ?? null,
          }
        : null,
  };
}

const contractInclude = {
  client: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, email: true } },
  contractProfiles: { select: { id: true } },
  careerApplication: { select: { id: true } },
  variations: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { variationDate: true, variationEndDate: true, createdAt: true },
  },
};

function latestVariationDates(
  variations?: Array<{ variationDate: Date; variationEndDate: Date | null; createdAt?: Date }>,
) {
  if (!variations?.length) {
    return { latestVariationStartDate: null as string | null, latestVariationEndDate: null as string | null };
  }
  const sortKey = (v: { variationDate: Date; createdAt?: Date }) =>
    v.createdAt?.getTime() ?? v.variationDate.getTime();
  const sorted = [...variations].sort((a, b) => sortKey(b) - sortKey(a));
  const latest = sorted[0]!;
  return {
    latestVariationStartDate: latest.variationDate.toISOString(),
    latestVariationEndDate: latest.variationEndDate?.toISOString() ?? null,
  };
}

const activityInclude = {
  performedBy: { select: { id: true, name: true, email: true } },
};

const detailInclude = {
  ...contractInclude,
  workUnitMonths: { orderBy: [{ year: "asc" as const }, { month: "asc" as const }] },
  contractProfiles: {
    orderBy: { createdAt: "asc" as const },
    include: {
      profile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          category: true,
          technology: true,
          available: true,
        },
      },
    },
  },
  variations: { orderBy: { variationDate: "desc" as const } },
  milestones: { orderBy: { milestoneDate: "asc" as const } },
  invoices: { orderBy: { issueDate: "desc" as const } },
  activityLogs: {
    orderBy: { createdAt: "desc" as const },
    include: activityInclude,
  },
  projects: {
    select: { id: true, projectNumber: true, contractVariationId: true },
  },
  careerApplication: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      status: true,
      jobListing: { select: { title: true } },
    },
  },
};

async function fetchContractDetail(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: detailInclude,
  });
}

router.get("/profile-options", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const contractId = typeof req.query.contractId === "string" ? req.query.contractId.trim() : "";
    let excludeIds: string[] = [];
    if (contractId) {
      const linked = await prisma.contractProfile.findMany({
        where: { contractId },
        select: { profileId: true },
      });
      excludeIds = linked.map((row) => row.profileId);
    }
    const profiles = await prisma.candidateProfile.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 50,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        category: true,
        technology: true,
        available: true,
      },
    });
    res.json({
      data: profiles.filter((row) => !excludeIds.includes(row.id)),
    });
  } catch (error) {
    console.error("Error fetching contract profile options:", error);
    res.status(500).json({ error: "Failed to fetch profile options" });
  }
});

router.get("/", async (req, res) => {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";
    const tab = typeof req.query.tab === "string" ? req.query.tab.trim() : "";
    const expiring = typeof req.query.expiring === "string" ? req.query.expiring.trim() : "";
    const type = typeof req.query.type === "string" ? req.query.type.trim() : "";
    const startDateFrom = parseDateQuery(req.query.startDateFrom);
    const startDateTo = parseDateQuery(req.query.startDateTo);
    const endDateFrom = parseDateQuery(req.query.endDateFrom);
    const endDateTo = parseDateQuery(req.query.endDateTo);
    const where: Prisma.ContractWhereInput = {};
    if (clientId) where.clientId = clientId;
    if (type && (CONTRACT_TYPES as readonly string[]).includes(type)) {
      where.type = type;
    }
    if (startDateFrom || startDateTo) {
      where.startDate = {
        ...(startDateFrom ? { gte: startDateFrom } : {}),
        ...(startDateTo ? { lte: startDateTo } : {}),
      };
    }
    if (endDateFrom || endDateTo) {
      where.endDate = {
        ...(endDateFrom ? { gte: endDateFrom } : {}),
        ...(endDateTo ? { lte: endDateTo } : {}),
      };
    }
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
            variations: {
              select: { variationEndDate: true, variationDate: true, createdAt: true },
            },
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
    const row = await fetchContractDetail(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeContract(row) });
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(500).json({ error: "Failed to fetch contract" });
  }
});

const contractProfileSchema = z.object({
  profileId: z.string().min(1),
});

router.post("/:id/profiles", async (req, res) => {
  try {
    const input = contractProfileSchema.parse(req.body);
    await ensureDraftContract(req.params.id);
    const profile = await prisma.candidateProfile.findUnique({ where: { id: input.profileId } });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.contractProfile.findUnique({
        where: { contractId_profileId: { contractId: req.params.id, profileId: input.profileId } },
        include: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              category: true,
              technology: true,
              available: true,
            },
          },
        },
      });
      if (existing) return existing;
      const created = await tx.contractProfile.create({
        data: { contractId: req.params.id, profileId: input.profileId },
        include: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              category: true,
              technology: true,
              available: true,
            },
          },
        },
      });
      await tx.candidateProfile.update({
        where: { id: input.profileId },
        data: { available: false },
      });
      return created;
    });

    res.status(201).json({ data: serializeContractProfile(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (error instanceof Error && error.message === "NOT_DRAFT") {
      return res.status(400).json({ error: "Profiles can only be added to draft contracts" });
    }
    console.error("Error adding contract profile:", error);
    res.status(500).json({ error: "Failed to add profile" });
  }
});

router.delete("/:id/profiles/:contractProfileId", async (req, res) => {
  try {
    await ensureDraftContract(req.params.id);
    const existing = await prisma.contractProfile.findFirst({
      where: { id: req.params.contractProfileId, contractId: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Profile link not found" });

    await prisma.$transaction(async (tx) => {
      await tx.contractProfile.delete({ where: { id: existing.id } });
      await syncProfileAvailableFlag(existing.profileId, tx);
    });

    res.json({ message: "Removed" });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (error instanceof Error && error.message === "NOT_DRAFT") {
      return res.status(400).json({ error: "Profiles can only be removed from draft contracts" });
    }
    console.error("Error removing contract profile:", error);
    res.status(500).json({ error: "Failed to remove profile" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const createMeta = contractCreateSchema.parse(req.body);
    const data = contractBaseSchema.parse(req.body);
    const endDate = normalizeEndDate(data.endDate ?? null);
    const dateError = validateContractDates(data.startDate, endDate);
    if (dateError) return res.status(400).json({ error: dateError });
    const workUnitMonths =
      data.type === "T_AND_M" && data.unit
        ? resolveTmWorkUnitMonths(data.startDate, endDate, data.unit, data.workUnitMonths)
        : [];
    const financials = resolveContractFinancials(data.type, { ...data, workUnitMonths });
    await ensureContractClient(data.clientId);
    const ownerId = data.ownerId ?? req.user?.id ?? null;
    await ensureContractOwner(ownerId);
    const contractNumber = await allocateContractNumber();

    let careerApplication:
      | {
          id: string;
          profileId: string | null;
          status: string;
          contractId: string | null;
        }
      | null = null;
    if (createMeta.careerApplicationId) {
      careerApplication = await prisma.careerApplication.findUnique({
        where: { id: createMeta.careerApplicationId },
        select: { id: true, profileId: true, status: true, contractId: true },
      });
      if (!careerApplication) {
        return res.status(400).json({ error: "Career application not found" });
      }
      if (careerApplication.status !== "SELECTED") {
        return res.status(400).json({ error: "Contract can only be created from selected applications" });
      }
      if (careerApplication.contractId) {
        return res.status(400).json({ error: "This application already has a linked contract" });
      }
    }

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.contract.create({
        data: {
          contractNumber,
          title: data.title,
          clientId: data.clientId,
          type: data.type,
          status: "DRAFT",
          startDate: data.startDate,
          endDate,
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
      if (data.type === "T_AND_M" && workUnitMonths.length) {
        await replaceWorkUnitMonths(tx, created.id, "base", workUnitMonths);
      }
      if (careerApplication) {
        await tx.careerApplication.update({
          where: { id: careerApplication.id },
          data: { contractId: created.id },
        });
        let profileId = careerApplication.profileId;
        if (!profileId) {
          const legacy = await tx.candidateProfile.findUnique({
            where: { careerApplicationId: careerApplication.id },
            select: { id: true },
          });
          profileId = legacy?.id ?? null;
        }
        if (profileId) {
          const existingProfile = await tx.contractProfile.findUnique({
            where: { contractId_profileId: { contractId: created.id, profileId } },
          });
          if (!existingProfile) {
            await tx.contractProfile.create({
              data: { contractId: created.id, profileId },
            });
            await tx.candidateProfile.update({
              where: { id: profileId },
              data: { available: false },
            });
          }
        }
      }
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
      const workUnits = await tx.contractWorkUnitMonth.findMany({
        where: { contractId: created.id },
        orderBy: [{ year: "asc" }, { month: "asc" }],
      });
      const detail = await tx.contract.findUnique({
        where: { id: created.id },
        include: detailInclude,
      });
      return detail ?? { ...created, workUnitMonths: workUnits, activityLogs: logs };
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
    const mergedStartDate = data.startDate ?? existing.startDate;
    const mergedEndDate =
      data.endDate !== undefined
        ? normalizeEndDate(data.endDate)
        : normalizeEndDate(existing.endDate);
    const mergedUnit = data.unit !== undefined ? data.unit : existing.unit;
    const dateError = validateContractDates(mergedStartDate, mergedEndDate);
    if (dateError) return res.status(400).json({ error: dateError });
    const workUnitMonths =
      nextType === "T_AND_M" && mergedUnit
        ? resolveTmWorkUnitMonths(
            mergedStartDate,
            mergedEndDate,
            mergedUnit,
            data.workUnitMonths,
          )
        : [];
    const financials = resolveContractFinancials(nextType, {
      unit: mergedUnit,
      numberOfUnits:
        data.numberOfUnits !== undefined ? data.numberOfUnits : toNumberOrNull(existing.numberOfUnits),
      rate: data.rate !== undefined ? data.rate : toNumber(existing.rate),
      contractValue:
        data.contractValue !== undefined ? data.contractValue : toNumber(existing.contractValue),
      workUnitMonths,
    });

    const merged = {
      title: data.title ?? existing.title,
      clientId: data.clientId ?? existing.clientId,
      type: nextType,
      status: existing.status,
      startDate: mergedStartDate,
      endDate: mergedEndDate,
      unit: financials.unit,
      numberOfUnits: financials.numberOfUnits,
      currency: data.currency ?? existing.currency,
      rate: financials.rate,
      contractValue: financials.contractValue,
      consumed: toNumber(existing.consumed),
      comments: data.comments ?? existing.comments,
      fileUrls:
        data.fileUrls ??
        normalizeContractFileUrls(existing.fileUrls),
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
      if (nextType === "T_AND_M") {
        await replaceWorkUnitMonths(tx, existing.id, "base", workUnitMonths);
      } else {
        await tx.contractWorkUnitMonth.deleteMany({
          where: { contractId: existing.id, segmentKey: "base" },
        });
      }
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
      await syncProjectBudgetsForContract(existing.id, tx);
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
      numberOfUnits: toNumberOrNull(existing.numberOfUnits),
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

router.post("/:id/create-project", async (req: AuthRequest, res) => {
  try {
    const contractId = req.params.id;
    if (!contractId) return res.status(400).json({ error: "Invalid id" });
    const variationId =
      typeof req.body?.variationId === "string" && req.body.variationId.trim()
        ? req.body.variationId.trim()
        : null;
    const projectManagerId = req.user?.id;
    if (!projectManagerId) return res.status(401).json({ error: "Unauthorized" });

    const project = await createProjectFromContract(contractId, projectManagerId, variationId);
    res.status(201).json({
      data: {
        id: project.id,
        projectNumber: project.projectNumber,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") return res.status(404).json({ error: "Contract not found" });
      if (error.message === "NOT_ACTIVE") {
        return res.status(400).json({ error: "Projects can only be created from active contracts" });
      }
      if (error.message === "VARIATION_NOT_FOUND") {
        return res.status(404).json({ error: "Variation not found" });
      }
      if (error.message === "PROJECT_EXISTS") {
        return res.status(400).json({ error: "A project already exists for this contract or variation" });
      }
    }
    console.error("Error creating project from contract:", error);
    res.status(500).json({ error: "Failed to create project" });
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
      await releaseProfilesForEndedContract(existing.id, tx);
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

router.patch("/:id/milestones/:milestoneId", async (req, res) => {
  try {
    const input = milestoneSchema.parse(req.body);
    await ensureActiveContract(req.params.id);
    const existing = await prisma.contractMilestone.findFirst({
      where: { id: req.params.milestoneId, contractId: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Milestone not found" });

    const row = await prisma.contractMilestone.update({
      where: { id: existing.id },
      data: {
        description: input.description.trim(),
        milestoneDate: input.milestoneDate,
        amount: input.amount,
      },
    });

    res.json({ data: serializeMilestone(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (error instanceof Error && error.message === "NOT_ACTIVE") {
      return res.status(400).json({ error: "Milestones can only be edited on active contracts" });
    }
    console.error("Error updating contract milestone:", error);
    res.status(500).json({ error: "Failed to update milestone" });
  }
});

router.delete("/:id/milestones/:milestoneId", async (req, res) => {
  try {
    await ensureActiveContract(req.params.id);
    const existing = await prisma.contractMilestone.findFirst({
      where: { id: req.params.milestoneId, contractId: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Milestone not found" });

    await prisma.contractMilestone.delete({ where: { id: existing.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (error instanceof Error && error.message === "NOT_ACTIVE") {
      return res.status(400).json({ error: "Milestones can only be deleted on active contracts" });
    }
    console.error("Error deleting contract milestone:", error);
    res.status(500).json({ error: "Failed to delete milestone" });
  }
});

router.post("/:id/variations", async (req: AuthRequest, res) => {
  try {
    const contractId = req.params.id;
    if (!contractId) return res.status(400).json({ error: "Invalid id" });
    const input = variationSchema.parse(req.body);
    const contract = await ensureActiveContract(contractId);
    const existingVariations = await prisma.contractVariation.findMany({
      where: { contractId: contract.id },
      select: { id: true, variationDate: true, variationEndDate: true },
    });
    const variationDateError = validateVariationDates(
      {
        variationDate: input.variationDate,
        variationEndDate: input.variationEndDate,
      },
      contract.startDate,
      existingVariations,
    );
    if (variationDateError) return res.status(400).json({ error: variationDateError });
    const payload = resolveVariationPayload(contract, input);
    const { workUnitMonths, ...variationData } = payload as typeof payload & {
      workUnitMonths?: WorkUnitMonthInput[];
    };

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.contractVariation.create({
        data: {
          contractId: contract.id,
          ...variationData,
        },
      });
      if (contract.type === "T_AND_M" && workUnitMonths?.length) {
        await replaceWorkUnitMonths(tx, contract.id, created.id, workUnitMonths);
      }
      await syncContractTotalVariation(tx, contract.id);
      await logContractVariationChange(
        tx,
        contract.id,
        "VARIATION_ADDED",
        `Variation added: ${created.variationValue.toString()} from ${created.variationDate.toISOString().slice(0, 10)}${
          created.variationEndDate ? ` to ${created.variationEndDate.toISOString().slice(0, 10)}` : ""
        }`,
        req.user?.id,
      );
      await maybeReactivateContractAfterVariation(tx, contract.id, req.user?.id);
      return created;
    });

    const workUnits =
      contract.type === "T_AND_M"
        ? await prisma.contractWorkUnitMonth.findMany({
            where: { contractId: contract.id, segmentKey: row.id },
            orderBy: [{ year: "asc" }, { month: "asc" }],
          })
        : [];
    res.status(201).json({ data: serializeVariation(row, workUnits) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (error instanceof Error && error.message === "NOT_ACTIVE") {
      return res.status(400).json({ error: "Variations can only be added to active contracts" });
    }
    if (error instanceof Error && error.message === "VARIATION_END_REQUIRED") {
      return res.status(400).json({ error: "Variation end date is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "VARIATION_QTY_REQUIRED") {
      return res.status(400).json({ error: "Qty is required for T&M variations" });
    }
    if (error instanceof Error && error.message === "VARIATION_RATE_REQUIRED") {
      return res.status(400).json({ error: "Rate is required for T&M variations" });
    }
    if (error instanceof Error && error.message === "VARIATION_VALUE_REQUIRED") {
      return res.status(400).json({ error: "Variation value is required" });
    }
    console.error("Error adding contract variation:", error);
    res.status(500).json({ error: "Failed to add variation" });
  }
});

router.patch("/:id/variations/:variationId", async (req: AuthRequest, res) => {
  try {
    const contractId = req.params.id;
    if (!contractId) return res.status(400).json({ error: "Invalid id" });
    const input = variationSchema.parse(req.body);
    const contract = await ensureActiveContract(contractId);
    const existing = await prisma.contractVariation.findFirst({
      where: { id: req.params.variationId, contractId: contract.id },
    });
    if (!existing) return res.status(404).json({ error: "Variation not found" });

    const existingVariations = await prisma.contractVariation.findMany({
      where: { contractId: contract.id },
      select: { id: true, variationDate: true, variationEndDate: true },
    });
    const variationDateError = validateVariationDates(
      {
        id: existing.id,
        variationDate: input.variationDate,
        variationEndDate: input.variationEndDate,
      },
      contract.startDate,
      existingVariations,
    );
    if (variationDateError) return res.status(400).json({ error: variationDateError });
    const payload = resolveVariationPayload(contract, input);
    const { workUnitMonths, ...variationData } = payload as typeof payload & {
      workUnitMonths?: WorkUnitMonthInput[];
    };
    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.contractVariation.update({
        where: { id: existing.id },
        data: variationData,
      });
      if (contract.type === "T_AND_M") {
        await replaceWorkUnitMonths(tx, contract.id, existing.id, workUnitMonths ?? []);
      }
      await syncContractTotalVariation(tx, contract.id);
      await logContractVariationChange(
        tx,
        contract.id,
        "VARIATION_UPDATED",
        `Variation updated: ${updated.variationValue.toString()} from ${updated.variationDate.toISOString().slice(0, 10)}${
          updated.variationEndDate ? ` to ${updated.variationEndDate.toISOString().slice(0, 10)}` : ""
        }`,
        req.user?.id,
      );
      await maybeReactivateContractAfterVariation(tx, contract.id, req.user?.id);
      await syncProjectBudgetsForContract(contract.id, tx);
      return updated;
    });

    const workUnits =
      contract.type === "T_AND_M"
        ? await prisma.contractWorkUnitMonth.findMany({
            where: { contractId: contract.id, segmentKey: row.id },
            orderBy: [{ year: "asc" }, { month: "asc" }],
          })
        : [];
    res.json({ data: serializeVariation(row, workUnits) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (error instanceof Error && error.message === "NOT_ACTIVE") {
      return res.status(400).json({ error: "Variations can only be edited on active contracts" });
    }
    if (error instanceof Error && error.message === "VARIATION_END_REQUIRED") {
      return res.status(400).json({ error: "Variation end date is required for T&M contracts" });
    }
    if (error instanceof Error && error.message === "VARIATION_QTY_REQUIRED") {
      return res.status(400).json({ error: "Qty is required for T&M variations" });
    }
    if (error instanceof Error && error.message === "VARIATION_RATE_REQUIRED") {
      return res.status(400).json({ error: "Rate is required for T&M variations" });
    }
    if (error instanceof Error && error.message === "VARIATION_VALUE_REQUIRED") {
      return res.status(400).json({ error: "Variation value is required" });
    }
    console.error("Error updating contract variation:", error);
    res.status(500).json({ error: "Failed to update variation" });
  }
});

router.delete("/:id/variations/:variationId", async (req: AuthRequest, res) => {
  try {
    const contractId = req.params.id;
    if (!contractId) return res.status(400).json({ error: "Invalid id" });
    await ensureActiveContract(contractId);
    const existing = await prisma.contractVariation.findFirst({
      where: { id: req.params.variationId, contractId },
    });
    if (!existing) return res.status(404).json({ error: "Variation not found" });

    await prisma.$transaction(async (tx) => {
      await logContractVariationChange(
        tx,
        contractId,
        "VARIATION_DELETED",
        `Variation deleted: ${existing.variationValue.toString()} from ${existing.variationDate.toISOString().slice(0, 10)}${
          existing.variationEndDate ? ` to ${existing.variationEndDate.toISOString().slice(0, 10)}` : ""
        }`,
        req.user?.id,
      );
      await tx.contractVariation.delete({ where: { id: existing.id } });
      await syncContractTotalVariation(tx, contractId);
      await syncProjectBudgetsForContract(contractId, tx);
    });

    res.json({ message: "Deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (error instanceof Error && error.message === "NOT_ACTIVE") {
      return res.status(400).json({ error: "Variations can only be deleted on active contracts" });
    }
    console.error("Error deleting contract variation:", error);
    res.status(500).json({ error: "Failed to delete variation" });
  }
});

router.patch("/:id/end-date", async (req: AuthRequest, res) => {
  try {
    const body = z
      .object({
        endDate: z.preprocess(
          (val) => (val === "" || val === null || val === undefined ? null : val),
          z.union([z.coerce.date(), z.null()]),
        ),
      })
      .parse(req.body);
    const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.status !== "ACTIVE" && existing.status !== "DRAFT") {
      return res.status(400).json({ error: "End date can only be updated on draft or active contracts" });
    }
    const mergedEndDate = normalizeEndDate(body.endDate);
    const dateError = validateContractDates(existing.startDate, mergedEndDate);
    if (dateError) return res.status(400).json({ error: dateError });

    const beforeSnapshot = contractSnapshotFromRow(existing);
    const row = await prisma.$transaction(async (tx) => {
      let tmPatch: {
        numberOfUnits?: number;
        contractValue?: number;
      } = {};
      if (existing.type === "T_AND_M" && existing.unit && mergedEndDate) {
        const workUnitMonths = resolveTmWorkUnitMonths(
          existing.startDate,
          mergedEndDate,
          existing.unit,
        );
        const units = workUnitMonths.length ? sumWorkUnits(workUnitMonths) : 0;
        const rate = toNumber(existing.rate);
        tmPatch = {
          numberOfUnits: units,
          contractValue: units * rate,
        };
        await replaceWorkUnitMonths(tx, existing.id, "base", workUnitMonths);
      }
      const updated = await tx.contract.update({
        where: { id: existing.id },
        data: { endDate: mergedEndDate, ...tmPatch },
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
      await syncProjectBudgetsForContract(existing.id, tx);
      return { ...updated, variations: [], activityLogs: logs };
    });

    const detail = await fetchContractDetail(row.id);
    res.json({ data: serializeContract(detail ?? row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating contract end date:", error);
    res.status(500).json({ error: "Failed to update end date" });
  }
});

router.post("/:id/invoices", async (req, res) => {
  try {
    const input = invoiceSchema.parse(req.body);
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contract) return res.status(404).json({ error: "Not found" });
    if (!isInvoiceableContractStatus(contract.status)) {
      return res.status(400).json({ error: "Invoices can only be added to active or expired contracts" });
    }

    const invoiceNumber = await allocateInvoiceNumber();
    const pricing = invoicePricing(input);
    const { amount, taxAmount, totalAmount } = computeInvoiceAmounts(pricing.qty, pricing.rate, input.taxRate);

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
          qty: pricing.qty,
          rate: pricing.rate,
          lineItems: pricing.lineItems,
          amount,
          taxRate: input.taxRate,
          taxAmount,
          totalAmount,
          fileUrl: input.fileUrl ?? null,
          ...(input.fileUrls ? { fileUrls: input.fileUrls } : {}),
        },
      });
      await syncContractConsumed(tx, contract.id);
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
    const contract = await ensureInvoiceableContract(req.params.id);
    const invoice = await prisma.contractInvoice.findFirst({
      where: { id: req.params.invoiceId, contractId: contract.id },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const body = invoiceUpdateSchema.parse(req.body);
    const revertingToDraft = body.status === "DRAFT" && invoice.status !== "DRAFT";
    // Attached documents can be added at any stage (e.g. the issued PDF once it's sent).
    const nonDraftAllowedKeys = new Set(["status", "dueDate", "fileUrls"]);
    const onlyNonDraftFields = Object.entries(body).every(
      ([key, value]) => value === undefined || nonDraftAllowedKeys.has(key),
    );

    if (invoice.status !== "DRAFT" && !revertingToDraft && !onlyNonDraftFields) {
      return res.status(400).json({
        error: "Only status, due date and files can be updated when invoice is not in Draft status",
      });
    }

    if (invoice.status !== "DRAFT" && !revertingToDraft) {
      const row = await prisma.contractInvoice.update({
        where: { id: invoice.id },
        data: {
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.dueDate !== undefined ? { dueDate: body.dueDate } : {}),
          ...(body.fileUrls !== undefined ? { fileUrls: body.fileUrls } : {}),
        },
      });
      return res.json({ data: serializeInvoice(row) });
    }

    // Sending qty/rate without lines (e.g. the contract page's single-line form) replaces any lines.
    const keepLines = body.lineItems === undefined && body.qty === undefined && body.rate === undefined;
    const pricing = keepLines
      ? {
          qty: toNumber(invoice.qty),
          rate: toNumber(invoice.rate),
          lineItems: (invoice.lineItems ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
        }
      : invoicePricing({
          qty: body.qty ?? toNumber(invoice.qty),
          rate: body.rate != null ? body.rate : toNumber(invoice.rate),
          lineItems: body.lineItems,
        });
    const { qty, rate } = pricing;
    const taxRate = body.taxRate != null ? body.taxRate : toNumber(invoice.taxRate);
    const { amount, taxAmount, totalAmount } = computeInvoiceAmounts(qty, rate, taxRate);

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.contractInvoice.update({
        where: { id: invoice.id },
        data: {
          reference: body.reference ?? invoice.reference,
          issueDate: body.issueDate ?? invoice.issueDate,
          dueDate: body.dueDate ?? invoice.dueDate,
          status: body.status ?? invoice.status,
          currency: body.currency ?? invoice.currency,
          description: body.description?.trim() ?? invoice.description,
          qty,
          rate,
          lineItems: pricing.lineItems,
          amount,
          taxRate,
          taxAmount,
          totalAmount,
          fileUrl: body.fileUrl !== undefined ? body.fileUrl : invoice.fileUrl,
          ...(body.fileUrls !== undefined ? { fileUrls: body.fileUrls } : {}),
        },
      });
      await syncContractConsumed(tx, contract.id);
      return updated;
    });

    res.json({ data: serializeInvoice(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (error instanceof Error && error.message === "NOT_INVOICEABLE") {
      return res.status(400).json({ error: "Invoices can only be edited on active or expired contracts" });
    }
    console.error("Error updating contract invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

router.delete("/:id/invoices/:invoiceId", async (req, res) => {
  try {
    await ensureInvoiceableContract(req.params.id);
    const invoice = await prisma.contractInvoice.findFirst({
      where: { id: req.params.invoiceId, contractId: req.params.id },
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    await prisma.$transaction(async (tx) => {
      await tx.contractInvoice.delete({ where: { id: invoice.id } });
      await syncContractConsumed(tx, req.params.id);
    });

    res.json({ message: "Deleted" });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Not found" });
    }
    if (error instanceof Error && error.message === "NOT_INVOICEABLE") {
      return res.status(400).json({ error: "Invoices can only be deleted on active or expired contracts" });
    }
    console.error("Error deleting contract invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
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
