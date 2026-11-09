/** Monthly timesheets key hours and comments by ISO date (YYYY-MM-DD). */
export type DateHours = Partial<Record<string, number>>;
export type DateComments = Partial<Record<string, string>>;

export type MonthCompletion = {
  requiredDays: number;
  filledDays: number;
  missingDays: string[];
  complete: boolean;
};

export type MonthDay = {
  iso: string;
  day: number;
  weekend: boolean;
  /** Outside the project start/end dates — cannot be filled. */
  locked: boolean;
};

function isoFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function currentMonthKey(): string {
  return isoFromUtc(new Date()).slice(0, 7);
}

export function monthKeyFromIso(iso: string): string {
  return iso.slice(0, 7);
}

export function isMonthKey(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

export function monthBounds(monthKey: string): { startIso: string; endIso: string } {
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  return {
    startIso: isoFromUtc(new Date(Date.UTC(y, m - 1, 1))),
    endIso: isoFromUtc(new Date(Date.UTC(y, m, 0))),
  };
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  return isoFromUtc(new Date(Date.UTC(y, m - 1 + delta, 1))).slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  const { startIso } = monthBounds(monthKey);
  return new Date(`${startIso}T00:00:00.000Z`).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDayLong(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDayShort(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Months (YYYY-MM) covered by the project, oldest first. */
export function projectMonthKeys(projectStartIso: string, projectEndIso: string): string[] {
  const keys: string[] = [];
  let key = projectStartIso.slice(0, 7);
  const last = projectEndIso.slice(0, 7);
  for (let i = 0; i < 240 && key <= last; i++) {
    keys.push(key);
    key = shiftMonth(key, 1);
  }
  return keys;
}

/** Every day of the month with weekend / locked flags (locked = outside the project dates). */
export function monthDays(monthKey: string, projectStartIso?: string, projectEndIso?: string): MonthDay[] {
  const { startIso, endIso } = monthBounds(monthKey);
  const days: MonthDay[] = [];
  const d = new Date(`${startIso}T00:00:00.000Z`);
  const end = new Date(`${endIso}T00:00:00.000Z`);
  while (d <= end) {
    const iso = isoFromUtc(d);
    const dow = d.getUTCDay();
    days.push({
      iso,
      day: d.getUTCDate(),
      weekend: dow === 0 || dow === 6,
      locked: Boolean(
        (projectStartIso && iso < projectStartIso.slice(0, 10)) || (projectEndIso && iso > projectEndIso.slice(0, 10)),
      ),
    });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

/** Number of blank cells before the 1st so the calendar starts on Monday. */
export function mondayOffset(monthKey: string): number {
  const { startIso } = monthBounds(monthKey);
  const dow = new Date(`${startIso}T00:00:00.000Z`).getUTCDay();
  return (dow + 6) % 7;
}

/** Allow up to 2 digits before the decimal and 2 after (e.g. 12.34). */
export function sanitizeHoursInput(raw: string): string {
  if (!raw) return "";
  let out = "";
  let dot = false;
  let digitsBeforeDot = 0;
  let digitsAfterDot = 0;
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      if (!dot) {
        if (digitsBeforeDot >= 2) continue;
        digitsBeforeDot += 1;
      } else {
        if (digitsAfterDot >= 2) continue;
        digitsAfterDot += 1;
      }
      out += ch;
    } else if (ch === "." && !dot) {
      out += ch;
      dot = true;
    }
  }
  return out;
}

export function hoursInputToNumber(raw: string): number | undefined {
  const s = sanitizeHoursInput(raw);
  if (!s || s === ".") return undefined;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function sumDateHours(hours: DateHours | null | undefined): number {
  return Object.values(hours ?? {}).reduce<number>((sum, v) => sum + (Number(v) || 0), 0);
}

export function monthCompletion(days: MonthDay[], totals: Map<string, number>, daysOff: Set<string>): MonthCompletion {
  const required = days.filter((d) => !d.locked && !d.weekend).map((d) => d.iso);
  const missingDays = required.filter((iso) => !daysOff.has(iso) && (totals.get(iso) ?? 0) <= 0);
  return {
    requiredDays: required.length,
    filledDays: required.length - missingDays.length,
    missingDays,
    complete: missingDays.length === 0,
  };
}
