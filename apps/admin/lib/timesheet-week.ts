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
  return date.toISOString().slice(0, 10);
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
