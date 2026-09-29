import { CONTRACT_STATUS_LABELS } from "@/lib/contract-status";
import { CONTRACT_TYPE_LABELS, CONTRACT_UNIT_LABELS, type ContractType } from "@/lib/contract-types";
import { CONTRACT_MOVE_TO_DRAFT_REASON_LABELS } from "@/lib/contract-groups";

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

export const CONTRACT_ACTIVITY_ACTION_LABELS: Record<string, string> = {
  CREATED: "Contract created",
  FIELD_UPDATED: "Field updated",
  ACTIVATED: "Contract activated",
  TERMINATED: "Contract terminated",
  MOVE_TO_DRAFT: "Moved to Draft",
  AUTO_EXPIRED: "Auto-expired",
  VARIATION_ADDED: "Variation added",
  VARIATION_UPDATED: "Variation updated",
  VARIATION_DELETED: "Variation deleted",
};

export type ContractActivityLogEntry = {
  id: string;
  action: string;
  fieldName: string | null;
  fieldLabel: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  reasonLabel: string | null;
  otherReason: string | null;
  performedByName: string;
  createdAt: string;
};

export function formatActivitySummary(log: ContractActivityLogEntry): string {
  if (log.action === "CREATED") {
    return "Contract created";
  }
  if (log.fieldName === "status" && log.oldValue && log.newValue) {
    return `Status changed from ${log.oldValue} to ${log.newValue}`;
  }
  if (log.action === "FIELD_UPDATED" && log.fieldLabel) {
    return `${log.fieldLabel} changed from ${log.oldValue ?? "—"} to ${log.newValue ?? "—"}`;
  }
  if (
    log.action === "VARIATION_ADDED" ||
    log.action === "VARIATION_UPDATED" ||
    log.action === "VARIATION_DELETED"
  ) {
    return log.newValue ?? CONTRACT_ACTIVITY_ACTION_LABELS[log.action] ?? log.action;
  }
  return CONTRACT_ACTIVITY_ACTION_LABELS[log.action] ?? log.action;
}
