import { mondayOfWeek, sundayOfWeek } from "./project-types";
import { WEEKDAY_KEYS, hoursByIsoDay, type DailyHours, type WeekdayKey } from "./timesheet-entries";

function toDateInputUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function projectDateBoundsIso(project: { startDate: Date; endDate: Date }) {
  return {
    startDate: toDateInputUtc(project.startDate),
    endDate: toDateInputUtc(project.endDate),
  };
}

export function weekDayIso(weekMondayIso: string, key: WeekdayKey): string {
  const index = WEEKDAY_KEYS.indexOf(key);
  const monday = new Date(`${weekMondayIso}T00:00:00.000Z`);
  const d = new Date(monday);
  d.setUTCDate(monday.getUTCDate() + index);
  return toDateInputUtc(d);
}

export function weekOverlapsProjectRange(
  weekMondayIso: string,
  projectStartIso: string,
  projectEndIso: string,
): boolean {
  const mon = new Date(`${weekMondayIso}T00:00:00.000Z`);
  const weekEndIso = toDateInputUtc(sundayOfWeek(mon));
  return weekMondayIso <= projectEndIso && weekEndIso >= projectStartIso;
}

export function snapWeekMondayToInput(value: string): string {
  if (!value) return toDateInputUtc(mondayOfWeek());
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return toDateInputUtc(mondayOfWeek());
  return toDateInputUtc(mondayOfWeek(d));
}

export function projectWeekMondayBounds(projectStartIso: string, projectEndIso: string) {
  const min = snapWeekMondayToInput(projectStartIso);
  let max = snapWeekMondayToInput(projectEndIso);
  if (!weekOverlapsProjectRange(max, projectStartIso, projectEndIso)) {
    let cur = max;
    for (let i = 0; i < 260; i++) {
      const prev = new Date(`${cur}T00:00:00.000Z`);
      prev.setUTCDate(prev.getUTCDate() - 7);
      cur = toDateInputUtc(prev);
      if (weekOverlapsProjectRange(cur, projectStartIso, projectEndIso)) {
        max = cur;
        break;
      }
      if (cur < min) break;
    }
  }
  return { min, max };
}

/**
 * Every logged day must fall inside both the timesheet period and the project dates
 * (e.g. a project starting 22 Oct locks 1–21 Oct on the October monthly sheet).
 */
export function assertTimesheetWithinProjectDates(
  project: { startDate: Date; endDate: Date },
  periodStartIso: string,
  periodEndIso: string,
  entryRows: { dailyHours: DailyHours }[],
  legacyHours?: DailyHours | null,
) {
  const { startDate, endDate } = projectDateBoundsIso(project);
  if (periodEndIso < startDate || periodStartIso > endDate) {
    throw new Error("TIMESHEET_WEEK_OUTSIDE_PROJECT");
  }

  const rows = entryRows.length > 0 ? entryRows : legacyHours ? [{ dailyHours: legacyHours }] : [];
  for (const row of rows) {
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

export function weekEndIsoFromMonday(weekMondayIso: string): string {
  return toDateInputUtc(sundayOfWeek(new Date(`${weekMondayIso}T00:00:00.000Z`)));
}
