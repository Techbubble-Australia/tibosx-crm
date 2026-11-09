import { hoursByIsoDay, type DailyHours } from "./timesheet-entries";

function toDateInputUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function projectDateBoundsIso(project: { startDate: Date; endDate: Date }) {
  return {
    startDate: toDateInputUtc(project.startDate),
    endDate: toDateInputUtc(project.endDate),
  };
}

/**
 * Every logged day must fall inside both the timesheet month and the project dates
 * (e.g. a project starting 22 Oct locks 1–21 Oct on the October sheet).
 */
export function assertTimesheetWithinProjectDates(
  project: { startDate: Date; endDate: Date },
  periodStartIso: string,
  periodEndIso: string,
  entryRows: { dailyHours: DailyHours }[],
) {
  const { startDate, endDate } = projectDateBoundsIso(project);
  if (periodEndIso < startDate || periodStartIso > endDate) {
    throw new Error("TIMESHEET_WEEK_OUTSIDE_PROJECT");
  }
  for (const row of entryRows) {
    for (const { iso } of hoursByIsoDay(periodStartIso, row.dailyHours)) {
      if (iso < periodStartIso || iso > periodEndIso) {
        throw new Error("TIMESHEET_HOURS_OUTSIDE_PERIOD");
      }
      if (iso < startDate || iso > endDate) {
        throw new Error("TIMESHEET_HOURS_OUTSIDE_PROJECT");
      }
    }
  }
}
