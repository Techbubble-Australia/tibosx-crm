import { TIMESHEET_STATUS_LABELS, type TimesheetStatus } from "@/lib/project-types";

export function timesheetStatusBadgeClass(status: string): string {
  switch (status) {
    case "DRAFT":
    case "DRAFT_UNSAVED":
      return "bg-gray-100 text-gray-800 ring-gray-200";
    case "SUBMITTED":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "APPROVED":
      return "bg-green-100 text-green-800 ring-green-200";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-200";
  }
}

export function TimesheetStatusBadge({ status }: { status: TimesheetStatus | string }) {
  const label =
    status === "DRAFT_UNSAVED"
      ? "Draft - Unsaved"
      : (TIMESHEET_STATUS_LABELS[status as TimesheetStatus] ?? status);
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${timesheetStatusBadgeClass(status)}`}
    >
      {label}
    </span>
  );
}
