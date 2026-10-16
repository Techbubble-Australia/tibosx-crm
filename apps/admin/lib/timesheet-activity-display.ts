const TIMESHEET_ACTIVITY_LABELS: Record<string, string> = {
  CREATED: "Timesheet created",
  UPDATED: "Timesheet updated",
  SUBMITTED: "Submitted for approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function formatTimesheetActivityTitle(action: string): string {
  const key = action.trim().toUpperCase();
  if (TIMESHEET_ACTIVITY_LABELS[key]) return TIMESHEET_ACTIVITY_LABELS[key];
  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
