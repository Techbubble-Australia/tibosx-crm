import type { Prisma } from "@techbubble/database";
import { CONTRACT_INVOICE_STATUS_LABELS, type ContractInvoiceStatus } from "./contract-invoice-status";

export const INVOICE_FIELD_LABELS: Record<string, string> = {
  reference: "Reference",
  issueDate: "Issue date",
  dueDate: "Due date",
  status: "Status",
  currency: "Currency",
  description: "Description",
  qty: "Quantity",
  rate: "Rate",
  amount: "Amount",
  taxRate: "Tax rate",
  taxAmount: "Tax amount",
  totalAmount: "Total amount",
  lineItems: "Line items",
  fileUrls: "Files",
};

const TRACKED_FIELDS = [
  "reference",
  "issueDate",
  "dueDate",
  "status",
  "currency",
  "description",
  "qty",
  "rate",
  "amount",
  "taxRate",
  "taxAmount",
  "totalAmount",
  "lineItems",
  "fileUrls",
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

export type InvoiceSnapshot = {
  reference: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  currency: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  taxRate: number;
  totalAmount: number;
  taxAmount: number;
  lineItems: string;
  fileUrls: string;
};

function toNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function summarizeLineItems(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "—";
  return `${value.length} line(s)`;
}

function summarizeFiles(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "—";
  return `${value.length} file(s)`;
}

function formatFieldValue(field: TrackedField, value: unknown): string {
  if (value == null || value === "") return "—";
  switch (field) {
    case "issueDate":
    case "dueDate":
      return formatDate(value as Date);
    case "status":
      return CONTRACT_INVOICE_STATUS_LABELS[value as ContractInvoiceStatus] ?? String(value);
    case "qty":
    case "rate":
    case "amount":
    case "taxRate":
    case "taxAmount":
    case "totalAmount": {
      const num = typeof value === "number" ? value : Number(value);
      return Number.isFinite(num) ? new Intl.NumberFormat("en-AU").format(num) : String(value);
    }
    case "lineItems":
    case "fileUrls":
      return String(value);
    default:
      return String(value);
  }
}

function valuesEqual(field: TrackedField, before: unknown, after: unknown): boolean {
  if (field === "issueDate" || field === "dueDate") {
    return formatDate(before as Date) === formatDate(after as Date);
  }
  if (
    field === "qty" ||
    field === "rate" ||
    field === "amount" ||
    field === "taxRate" ||
    field === "taxAmount" ||
    field === "totalAmount"
  ) {
    return Number(before) === Number(after);
  }
  return String(before ?? "") === String(after ?? "");
}

export function invoiceSnapshotFromRow(row: {
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
  lineItems?: unknown;
  fileUrls?: unknown;
}): InvoiceSnapshot {
  return {
    reference: row.reference,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    status: row.status,
    currency: row.currency,
    description: row.description,
    qty: toNumber(row.qty),
    rate: toNumber(row.rate),
    amount: toNumber(row.amount),
    taxRate: toNumber(row.taxRate),
    taxAmount: toNumber(row.taxAmount),
    totalAmount: toNumber(row.totalAmount),
    lineItems: summarizeLineItems(row.lineItems),
    fileUrls: summarizeFiles(row.fileUrls),
  };
}

export async function logInvoiceCreated(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  performedById: string | null | undefined,
): Promise<void> {
  await tx.contractInvoiceActivityLog.create({
    data: {
      invoiceId,
      action: "CREATED",
      performedById: performedById ?? null,
    },
  });
}

export async function logInvoiceFieldChanges(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  before: InvoiceSnapshot,
  after: InvoiceSnapshot,
  performedById: string | null | undefined,
): Promise<void> {
  for (const field of TRACKED_FIELDS) {
    const oldValue = before[field];
    const newValue = after[field];
    if (valuesEqual(field, oldValue, newValue)) continue;
    await tx.contractInvoiceActivityLog.create({
      data: {
        invoiceId,
        action: "FIELD_UPDATED",
        fieldName: field,
        oldValue: formatFieldValue(field, oldValue),
        newValue: formatFieldValue(field, newValue),
        performedById: performedById ?? null,
      },
    });
  }
}

export function serializeInvoiceActivityLog(row: {
  id: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  performedBy: { name: string | null; email: string } | null;
}) {
  return {
    id: row.id,
    action: row.action,
    fieldName: row.fieldName,
    fieldLabel: row.fieldName ? INVOICE_FIELD_LABELS[row.fieldName] ?? row.fieldName : null,
    oldValue: row.oldValue,
    newValue: row.newValue,
    performedByName: row.performedBy?.name?.trim() || row.performedBy?.email || "",
    createdAt: row.createdAt.toISOString(),
  };
}
