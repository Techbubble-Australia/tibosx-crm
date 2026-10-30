export const PROJECT_KINDS = ["DELIVERY", "SUPPORT"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

export const PROJECT_KIND_LABELS: Record<ProjectKind, string> = {
  DELIVERY: "Delivery",
  SUPPORT: "Support",
};

export const PROJECT_STATUSES = ["DRAFT", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const TIMESHEET_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED"] as const;
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number];

export const TIMESHEET_STATUS_LABELS: Record<TimesheetStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted - Awaiting Approval",
  APPROVED: "Approved",
};

export const PROJECT_COST_TYPES = ["personnel", "one-time", "other"] as const;
export type ProjectCostType = (typeof PROJECT_COST_TYPES)[number];

export const PROJECT_COST_TYPE_LABELS: Record<ProjectCostType, string> = {
  personnel: "Personnel",
  "one-time": "One-time",
  other: "Other",
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatProjectMonth(year: number, month: number): string {
  return `${MONTH_LABELS[month]} ${year}`;
}
