import type { Prisma } from "@techbubble/database";
import { PROJECT_KIND_LABELS, PROJECT_STATUS_LABELS, type ProjectKind } from "./project-types";

export const PROJECT_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  clientId: "Client",
  kind: "Project type",
  status: "Status",
  projectManagerId: "Project manager",
  timesheetApproverUserId: "Timesheet approver",
  contractId: "Contract",
  startDate: "Start date",
  endDate: "End date",
  timesheetPeriod: "Timesheet type",
};

const TRACKED_FIELDS = [
  "title",
  "description",
  "clientId",
  "kind",
  "status",
  "projectManagerId",
  "timesheetApproverUserId",
  "contractId",
  "startDate",
  "endDate",
  "timesheetPeriod",
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

export type ProjectSnapshot = {
  title: string;
  description: string;
  clientId: string;
  kind: string;
  status: string;
  projectManagerId: string;
  timesheetApproverUserId: string;
  contractId: string | null;
  startDate: Date;
  endDate: Date;
  timesheetPeriod: string;
};

type ActivityContext = {
  clientNames: Map<string, string>;
  managerNames: Map<string, string>;
  contractNumbers: Map<string, string>;
};

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return value.toISOString().slice(0, 10);
}

function formatFieldValue(field: TrackedField, value: unknown, context: ActivityContext): string {
  if (value == null || value === "") return "—";
  switch (field) {
    case "clientId":
      return context.clientNames.get(String(value)) ?? String(value);
    case "projectManagerId":
    case "timesheetApproverUserId":
      return context.managerNames.get(String(value)) ?? String(value);
    case "contractId":
      return context.contractNumbers.get(String(value)) ?? String(value);
    case "kind":
      return PROJECT_KIND_LABELS[value as ProjectKind] ?? String(value);
    case "status":
      return PROJECT_STATUS_LABELS[value as keyof typeof PROJECT_STATUS_LABELS] ?? String(value);
    case "startDate":
    case "endDate":
      return formatDate(value as Date);
    case "timesheetPeriod":
      return value === "MONTHLY" ? "Monthly" : "Weekly";
    default:
      return String(value);
  }
}

export async function buildProjectActivityContext(
  tx: Prisma.TransactionClient,
  before: ProjectSnapshot,
  after: ProjectSnapshot,
): Promise<ActivityContext> {
  const clientIds = [before.clientId, after.clientId];
  const managerIds = [before.projectManagerId, after.projectManagerId, before.timesheetApproverUserId, after.timesheetApproverUserId];
  const contractIds = [before.contractId, after.contractId].filter(Boolean) as string[];

  const [clients, managers, contracts] = await Promise.all([
    tx.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } }),
    tx.adminUser.findMany({
      where: { id: { in: managerIds } },
      select: { id: true, name: true, email: true },
    }),
    contractIds.length
      ? tx.contract.findMany({
          where: { id: { in: contractIds } },
          select: { id: true, contractNumber: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    clientNames: new Map(clients.map((row) => [row.id, row.name])),
    managerNames: new Map(managers.map((row) => [row.id, row.name || row.email])),
    contractNumbers: new Map(contracts.map((row) => [row.id, row.contractNumber])),
  };
}

export async function logProjectFieldChanges(
  tx: Prisma.TransactionClient,
  projectId: string,
  before: ProjectSnapshot,
  after: ProjectSnapshot,
  performedById: string | null,
): Promise<void> {
  const context = await buildProjectActivityContext(tx, before, after);

  for (const field of TRACKED_FIELDS) {
    const oldRaw = before[field];
    const newRaw = after[field];
    const oldStr =
      field === "startDate" || field === "endDate"
        ? formatDate(oldRaw as Date)
        : String(oldRaw ?? "");
    const newStr =
      field === "startDate" || field === "endDate"
        ? formatDate(newRaw as Date)
        : String(newRaw ?? "");
    if (oldStr === newStr) continue;

    await tx.projectActivityLog.create({
      data: {
        projectId,
        action: "FIELD_UPDATED",
        fieldName: PROJECT_FIELD_LABELS[field] ?? field,
        oldValue: formatFieldValue(field, oldRaw, context),
        newValue: formatFieldValue(field, newRaw, context),
        performedById,
      },
    });
  }
}
