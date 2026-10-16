import type { ContractUnit } from "@/lib/contract-types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type WorkUnitMonthRow = {
  year: number;
  month: number;
  workUnits: number;
  label: string;
};

export type WorkUnitMonthInput = {
  year: number;
  month: number;
  workUnits: number;
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isWeekdayUtc(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function weekdaysInMonthRange(year: number, month: number, rangeStart: Date, rangeEnd: Date): number {
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));
  const from = startOfUtcDay(rangeStart);
  const to = startOfUtcDay(rangeEnd);
  const start = from > monthStart ? from : monthStart;
  const end = to < monthEnd ? to : monthEnd;
  if (end < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isWeekdayUtc(cursor)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month]} ${year}`;
}

export function sumWorkUnits(rows: Array<{ workUnits: number }>): number {
  return rows.reduce((sum, row) => sum + row.workUnits, 0);
}

export function roundWorkUnits(value: number): number {
  return Math.round(value * 100) / 100;
}

export function generateWorkUnitMonths(
  startDate: string,
  endDate: string | null | undefined,
  unit: ContractUnit | string,
): WorkUnitMonthRow[] {
  if (!startDate || !endDate) return [];

  const start = startOfUtcDay(new Date(startDate));
  const end = startOfUtcDay(new Date(endDate));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const rows: WorkUnitMonthRow[] = [];
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const weekdays = weekdaysInMonthRange(year, month, start, end);
    if (weekdays > 0) {
      const raw = unit === "HOUR" ? weekdays * 8 : weekdays;
      const workUnits = roundWorkUnits(raw);
      rows.push({
        year,
        month,
        workUnits,
        label: formatMonthLabel(year, month),
      });
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return rows;
}
