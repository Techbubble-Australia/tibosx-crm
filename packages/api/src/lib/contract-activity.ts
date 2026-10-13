import type { Prisma } from "@techbubble/database";
import { CONTRACT_STATUS_LABELS } from "./contract-status";
import { CONTRACT_TYPE_LABELS, CONTRACT_UNIT_LABELS, type ContractType } from "./contract-types";

export const CONTRACT_ACTIVITY_ACTIONS = [
  "CREATED",
  "FIELD_UPDATED",
  "ACTIVATED",
  "TERMINATED",
  "MOVE_TO_DRAFT",
  "AUTO_EXPIRED",
  "VARIATION_ADDED",
  "VARIATION_UPDATED",
  "VARIATION_DELETED",
] as const;

export type ContractActivityAction = (typeof CONTRACT_ACTIVITY_ACTIONS)[number];

export const CONTRACT_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  clientId: "Client",
  type: "Type",
  status: "Status",
  startDate: "Start date",
  endDate: "End date",
  unit: "Unit",
  numberOfUnits: "No. of units",
  currency: "Currency",
  rate: "Rate",
  contractValue: "Contract value",
  ownerId: "Contract owner",
  comments: "Comments",
};

const TRACKED_FIELDS = [
  "title",
  "clientId",
  "type",
  "startDate",
  "endDate",
  "unit",
  "numberOfUnits",
  "currency",
  "rate",
  "contractValue",
  "ownerId",
  "comments",
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

export type ContractSnapshot = {
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
  ownerId: string | null;
  comments: string;
};

type ActivityContext = {
  clientNames: Map<string, string>;
  ownerNames: Map<string, string>;
};

function toNumber(value: { toString(): string } | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === "number" ? value : Number(value.toString());
}

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return value.toISOString().slice(0, 10);
}

function formatFieldValue(
  field: TrackedField | "status",
  value: unknown,
  context: ActivityContext,
): string {
  if (value == null || value === "") return "—";
  switch (field) {
    case "clientId":
      return context.clientNames.get(String(value)) ?? String(value);
    case "ownerId":
      return context.ownerNames.get(String(value)) ?? String(value);
    case "type":
      return CONTRACT_TYPE_LABELS[value as ContractType] ?? String(value);
    case "status":
      return CONTRACT_STATUS_LABELS[value as keyof typeof CONTRACT_STATUS_LABELS] ?? String(value);
    case "unit":
      return CONTRACT_UNIT_LABELS[value as keyof typeof CONTRACT_UNIT_LABELS] ?? String(value);
    case "startDate":
    case "endDate":
      return formatDate(value as Date);
    case "numberOfUnits":
      return String(value);
    case "rate":
    case "contractValue": {
      const num = toNumber(value as { toString(): string } | number);
      return num == null ? "—" : new Intl.NumberFormat("en-US").format(num);
    }
    default:
      return String(value);
  }
}

function valuesEqual(field: TrackedField, before: unknown, after: unknown): boolean {
  if (before == null && after == null) return true;
  if (field === "startDate" || field === "endDate") {
    const beforeDate = before instanceof Date ? before.toISOString().slice(0, 10) : before;
    const afterDate = after instanceof Date ? after.toISOString().slice(0, 10) : after;
    return beforeDate === afterDate;
  }
  if (field === "rate" || field === "contractValue") {
    return toNumber(before as { toString(): string } | number) === toNumber(after as { toString(): string } | number);
  }
  return String(before ?? "") === String(after ?? "");
}

export async function buildActivityContext(
  tx: Prisma.TransactionClient,
  snapshots: ContractSnapshot[],
): Promise<ActivityContext> {
  const clientIds = new Set<string>();
  const ownerIds = new Set<string>();
  for (const snapshot of snapshots) {
    clientIds.add(snapshot.clientId);
    if (snapshot.ownerId) ownerIds.add(snapshot.ownerId);
  }
  const [clients, owners] = await Promise.all([
    clientIds.size
      ? tx.client.findMany({
          where: { id: { in: [...clientIds] } },
          select: { id: true, name: true },
        })
      : [],
    ownerIds.size
      ? tx.adminUser.findMany({
          where: { id: { in: [...ownerIds] } },
          select: { id: true, name: true, email: true },
        })
      : [],
  ]);
  return {
    clientNames: new Map(clients.map((row) => [row.id, row.name])),
    ownerNames: new Map(owners.map((row) => [row.id, row.name || row.email])),
  };
}

export async function logContractFieldChanges(
  tx: Prisma.TransactionClient,
  contractId: string,
  before: ContractSnapshot,
  after: ContractSnapshot,
  performedById: string | null | undefined,
): Promise<void> {
  const context = await buildActivityContext(tx, [before, after]);
  for (const field of TRACKED_FIELDS) {
    const oldValue = before[field];
    const newValue = after[field];
    if (valuesEqual(field, oldValue, newValue)) continue;
    await tx.contractActivityLog.create({
      data: {
        contractId,
        action: "FIELD_UPDATED",
        fieldName: field,
        oldValue: formatFieldValue(field, oldValue, context),
        newValue: formatFieldValue(field, newValue, context),
        performedById: performedById ?? null,
      },
    });
  }
}

export async function logContractVariationChange(
  tx: Prisma.TransactionClient,
  contractId: string,
  action: "VARIATION_ADDED" | "VARIATION_UPDATED" | "VARIATION_DELETED",
  summary: string,
  performedById: string | null | undefined,
): Promise<void> {
  await tx.contractActivityLog.create({
    data: {
      contractId,
      action,
      fieldName: "variation",
      oldValue: null,
      newValue: summary,
      performedById: performedById ?? null,
    },
  });
}

export async function logContractStatusChange(
  tx: Prisma.TransactionClient,
  contractId: string,
  action: "ACTIVATED" | "TERMINATED" | "MOVE_TO_DRAFT" | "AUTO_EXPIRED",
  oldStatus: string,
  newStatus: string,
  performedById: string | null | undefined,
  extra?: { reason?: string | null; otherReason?: string | null },
): Promise<void> {
  const context = await buildActivityContext(tx, []);
  await tx.contractActivityLog.create({
    data: {
      contractId,
      action,
      fieldName: "status",
      oldValue: formatFieldValue("status", oldStatus, context),
      newValue: formatFieldValue("status", newStatus, context),
      reason: extra?.reason ?? null,
      otherReason: extra?.otherReason ?? null,
      performedById: performedById ?? null,
    },
  });
}

export function contractSnapshotFromRow(row: {
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
  ownerId: string | null;
  comments: string;
}): ContractSnapshot {
  return {
    title: row.title,
    clientId: row.clientId,
    type: row.type,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    unit: row.unit,
    numberOfUnits: row.numberOfUnits == null ? null : toNumber(row.numberOfUnits),
    currency: row.currency,
    rate: row.rate,
    contractValue: row.contractValue,
    ownerId: row.ownerId,
    comments: row.comments,
  };
}
