export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export type DailyHours = Partial<Record<WeekdayKey, number>>;
export type DailyComments = Partial<Record<WeekdayKey, string>>;

export function mondayOfWeek(date = new Date()): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function sundayOfWeek(date = new Date()): Date {
  const monday = mondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday;
}

export function toDateInputUtc(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Sunday (UTC) for a Monday ISO date, or "" when the Monday value is missing/invalid. */
export function weekSundayIsoFromMonday(mondayInput: string): string {
  if (!mondayInput) return "";
  const mon = new Date(`${mondayInput}T00:00:00.000Z`);
  if (Number.isNaN(mon.getTime())) return "";
  return toDateInputUtc(sundayOfWeek(mon));
}

export function weekDatesFromMonday(mondayInput: string): { key: WeekdayKey; label: string; iso: string }[] {
  const monday = new Date(`${mondayInput}T00:00:00.000Z`);
  if (Number.isNaN(monday.getTime())) return [];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return WEEKDAY_KEYS.map((key, index) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + index);
    const day = d.getUTCDate();
    const month = d.toLocaleString("en-AU", { month: "short", timeZone: "UTC" });
    return { key, label: `${labels[index]} ${day} ${month}`, iso: toDateInputUtc(d) };
  });
}

export function snapToMondayInput(value: string): string {
  if (!value) return toDateInputUtc(mondayOfWeek());
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return toDateInputUtc(mondayOfWeek());
  return toDateInputUtc(mondayOfWeek(d));
}

export function sumDailyHours(hours: DailyHours): number {
  return WEEKDAY_KEYS.reduce((sum, key) => sum + (Number(hours[key]) || 0), 0);
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

export function weekOverlapsProjectRange(
  weekMondayIso: string,
  projectStartIso: string,
  projectEndIso: string,
): boolean {
  const mon = new Date(`${weekMondayIso}T00:00:00.000Z`);
  const weekEndIso = toDateInputUtc(sundayOfWeek(mon));
  return weekMondayIso <= projectEndIso && weekEndIso >= projectStartIso;
}

export function projectWeekMondayBounds(projectStartIso: string, projectEndIso: string) {
  const min = snapToMondayInput(projectStartIso);
  let max = snapToMondayInput(projectEndIso);
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
