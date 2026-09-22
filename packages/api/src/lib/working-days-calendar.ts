/** UTC date key for holiday lookups: YYYY-MM-DD */
function dateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function easterSundayUtc(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month, day));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Monday if date falls on Sat/Sun; otherwise the same day (Australia-style substitution). */
function observedMondayIfWeekend(date: Date): Date {
  const day = date.getUTCDay();
  if (day === 6) return addUtcDays(date, 2);
  if (day === 0) return addUtcDays(date, 1);
  return date;
}

function australiaHolidaysForYear(year: number): Set<string> {
  const keys = new Set<string>();
  const add = (date: Date) => keys.add(dateKey(date));

  add(observedMondayIfWeekend(new Date(Date.UTC(year, 0, 1))));
  add(observedMondayIfWeekend(new Date(Date.UTC(year, 0, 26))));

  const easter = easterSundayUtc(year);
  add(addUtcDays(easter, -2));
  add(addUtcDays(easter, 1));
  add(observedMondayIfWeekend(new Date(Date.UTC(year, 3, 25))));

  // King's Birthday — first Monday in June (NSW/VIC/SA/TAS/NT/ACT).
  const juneFirst = new Date(Date.UTC(year, 5, 1));
  const juneDay = juneFirst.getUTCDay();
  const daysUntilMonday = juneDay === 1 ? 0 : juneDay === 0 ? 1 : 8 - juneDay;
  add(addUtcDays(juneFirst, daysUntilMonday));

  add(observedMondayIfWeekend(new Date(Date.UTC(year, 11, 25))));
  add(observedMondayIfWeekend(new Date(Date.UTC(year, 11, 26))));

  return keys;
}

const holidayCache = new Map<string, Set<string>>();

function holidaysForCountry(country: string, year: number): Set<string> {
  const normalized = country.trim().toLowerCase();
  const cacheKey = `${normalized}:${year}`;
  const cached = holidayCache.get(cacheKey);
  if (cached) return cached;

  let holidays = new Set<string>();
  if (normalized === "australia" || normalized === "au") {
    holidays = australiaHolidaysForYear(year);
  }

  holidayCache.set(cacheKey, holidays);
  return holidays;
}

export function isWorkingDay(date: Date, country: string): boolean {
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;
  const holidays = holidaysForCountry(country, date.getUTCFullYear());
  return !holidays.has(dateKey(date));
}

export function countWorkingDaysInRange(
  start: Date,
  end: Date,
  country: string,
): number {
  const from = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const to = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  if (to < from) return 0;

  let count = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    if (isWorkingDay(cursor, country)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}
