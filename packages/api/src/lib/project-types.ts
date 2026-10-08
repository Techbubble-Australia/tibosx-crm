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
  SUBMITTED: "Submitted",
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

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isWeekdayUtc(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function weekdaysInMonthRange(year: number, month: number, rangeStart: Date, rangeEnd: Date): number {
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));
  const from = startOfUtcDay(rangeStart);
  const to = startOfUtcDay(rangeEnd);
  const start = from > monthStart ? from : monthStart;
  const end = to < monthEnd ? to : monthEnd;
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isWeekdayUtc(cursor)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export type ProjectMonthRow = { year: number; month: number; label: string; qty: number };

export function generateProjectMonths(
  startDate: Date,
  endDate: Date,
  contractType: string | null | undefined,
  contractUnit: string | null | undefined,
): ProjectMonthRow[] {
  const start = startOfUtcDay(startDate);
  const end = startOfUtcDay(endDate);
  if (end < start) return [];

  const isTm = contractType === "T_AND_M";
  const rows: ProjectMonthRow[] = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    let qty = isTm ? weekdaysInMonthRange(year, month, start, end) : 1;
    if (isTm && contractUnit === "HOUR") qty *= 8;
    if (qty > 0) {
      rows.push({ year, month, label: formatProjectMonth(year, month), qty });
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return rows;
}

export function mondayOfWeek(date = new Date()): Date {
  const d = startOfUtcDay(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function sundayOfWeek(date = new Date()): Date {
  const monday = mondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return sunday;
}
