import { projectDateBoundsIso } from "./timesheet-project-dates";
import { totalHoursByIsoDay, type DailyHours } from "./timesheet-entries";

const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function isoFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "2026-10" → { startIso: "2026-10-01", endIso: "2026-10-31" } */
export function monthBounds(monthKey: string): { startIso: string; endIso: string } {
  if (!MONTH_KEY_RE.test(monthKey)) throw new Error("INVALID_MONTH");
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  return { startIso: isoFromUtc(start), endIso: isoFromUtc(end) };
}

export function monthKeyFromDate(date: Date | string): string {
  const iso = typeof date === "string" ? date.slice(0, 10) : isoFromUtc(date);
  return iso.slice(0, 7);
}

export function isMonthKey(value: string): boolean {
  return MONTH_KEY_RE.test(value);
}

export function isFirstOfMonthIso(iso: string): boolean {
  return /^\d{4}-\d{2}-01$/.test(iso);
}

/** Months (YYYY-MM) touched by the project, oldest first. */
export function projectMonthKeys(project: { startDate: Date; endDate: Date }): string[] {
  const { startDate, endDate } = projectDateBoundsIso(project);
  const keys: string[] = [];
  let [y, m] = startDate.slice(0, 7).split("-").map(Number) as [number, number];
  const last = endDate.slice(0, 7);
  for (let i = 0; i < 240; i++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    keys.push(key);
    if (key >= last) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys;
}

function eachIsoDay(startIso: string, endIso: string): string[] {
  const days: string[] = [];
  const d = new Date(`${startIso}T00:00:00.000Z`);
  const end = new Date(`${endIso}T00:00:00.000Z`);
  while (d <= end) {
    days.push(isoFromUtc(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

function isWeekendIso(iso: string): boolean {
  const dow = new Date(`${iso}T00:00:00.000Z`).getUTCDay();
  return dow === 0 || dow === 6;
}

/** Days of the month inside the project dates; the rest of the month is locked. */
export function openDaysInMonth(monthKey: string, project: { startDate: Date; endDate: Date }): string[] {
  const { startIso, endIso } = monthBounds(monthKey);
  const { startDate, endDate } = projectDateBoundsIso(project);
  const from = startIso > startDate ? startIso : startDate;
  const to = endIso < endDate ? endIso : endDate;
  return from <= to ? eachIsoDay(from, to) : [];
}

/** Weekdays (Mon–Fri) that must have hours or be marked as a day off before submitting. */
export function requiredDaysInMonth(monthKey: string, project: { startDate: Date; endDate: Date }): string[] {
  return openDaysInMonth(monthKey, project).filter((iso) => !isWeekendIso(iso));
}

export const DAY_OFF_KINDS = ["LEAVE", "HOLIDAY"] as const;
export type DayOffKind = (typeof DAY_OFF_KINDS)[number];
export type DayOff = { date: string; kind: DayOffKind };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Stored as `{ date, kind }`; plain ISO strings (older rows) are read as leave. One entry per date. */
export function normalizeDaysOff(raw: unknown): DayOff[] {
  if (!Array.isArray(raw)) return [];
  const byDate = new Map<string, DayOffKind>();
  for (const item of raw) {
    if (typeof item === "string" && ISO_DATE_RE.test(item)) {
      byDate.set(item, "LEAVE");
    } else if (item && typeof item === "object") {
      const { date, kind } = item as { date?: unknown; kind?: unknown };
      if (typeof date === "string" && ISO_DATE_RE.test(date)) {
        byDate.set(date, kind === "HOLIDAY" ? "HOLIDAY" : "LEAVE");
      }
    }
  }
  return [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, kind]) => ({ date, kind }));
}

export function dayOffDates(daysOff: DayOff[]): string[] {
  return daysOff.map((d) => d.date);
}

/** Days off (personal leave or public holiday) must be open weekdays of the month with no hours logged. */
export function assertValidDaysOff(
  monthKey: string,
  project: { startDate: Date; endDate: Date },
  daysOff: DayOff[],
  entryRows: Array<{ dailyHours: DailyHours }>,
) {
  const required = new Set(requiredDaysInMonth(monthKey, project));
  const { startIso } = monthBounds(monthKey);
  const hours = totalHoursByIsoDay(startIso, entryRows.map((r) => r.dailyHours));
  for (const { date } of daysOff) {
    if (!required.has(date)) throw new Error("INVALID_DAY_OFF");
    if ((hours.get(date) ?? 0) > 0) throw new Error("DAY_OFF_HAS_HOURS");
  }
}

export type MonthCompletion = {
  requiredDays: number;
  filledDays: number;
  missingDays: string[];
  complete: boolean;
};

export function monthCompletion(
  monthKey: string,
  project: { startDate: Date; endDate: Date },
  entryRows: Array<DailyHours | null | undefined>,
  daysOff: string[],
): MonthCompletion {
  const required = requiredDaysInMonth(monthKey, project);
  const { startIso } = monthBounds(monthKey);
  const hours = totalHoursByIsoDay(startIso, entryRows);
  const off = new Set(daysOff);
  const missingDays = required.filter((iso) => !off.has(iso) && (hours.get(iso) ?? 0) <= 0);
  return {
    requiredDays: required.length,
    filledDays: required.length - missingDays.length,
    missingDays,
    complete: missingDays.length === 0,
  };
}

export function formatIsoDayShort(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
