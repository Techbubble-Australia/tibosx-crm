import { notifyAsync } from "./notifications";

/** @deprecated Use notifyAsync("timesheet.submitted.client", …) — kept for existing imports. */
export function notifyClientApproverOfSubmittedTimesheet(timesheetId: string) {
  notifyAsync("timesheet.submitted.client", { timesheetId });
}
