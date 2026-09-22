import type { ContractType } from "./contract-types";

export type ForecastContract = {
  id: string;
  type: ContractType;
  status: string;
  startDate: Date;
  endDate: Date | null;
  rate: number;
  unit: string | null;
  currency: string;
  clientId: string;
  clientName: string;
  clientCountry: string;
  variations: Array<{ variationDate: Date; variationEndDate: Date | null }>;
  milestones: Array<{ milestoneDate: Date; amount: number }>;
};

export type ForecastInvoice = {
  amount: number;
  totalAmount: number;
  dueDate: Date;
  status: string;
  clientId: string;
  clientName: string;
  currency: string;
};

function isWeekday(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isValidEndDate(endDate: Date | null | undefined): boolean {
  if (!endDate) return false;
  return endDate.getUTCFullYear() >= 1971;
}

export function workingDaysInRange(start: Date, end: Date): number {
  const from = startOfUtcDay(start);
  const to = startOfUtcDay(end);
  if (to < from) return 0;
  let count = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    if (isWeekday(cursor)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export function workingDaysInMonth(year: number, month: number, rangeStart: Date, rangeEnd: Date): number {
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));
  const start = rangeStart > monthStart ? rangeStart : monthStart;
  const end = rangeEnd < monthEnd ? rangeEnd : monthEnd;
  if (end < start) return 0;
  return workingDaysInRange(start, end);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Base contract period, then extension periods for variations beyond base end. */
export function forecastPeriods(
  startDate: Date,
  endDate: Date | null,
  variations: Array<{ variationDate: Date; variationEndDate: Date | null }>,
): Array<{ start: Date; end: Date }> {
  const periods: Array<{ start: Date; end: Date }> = [];
  const baseEnd = isValidEndDate(endDate) ? startOfUtcDay(endDate!) : null;
  const start = startOfUtcDay(startDate);

  if (baseEnd && baseEnd >= start) {
    periods.push({ start, end: baseEnd });
  }

  const sorted = [...variations]
    .filter((row) => row.variationEndDate && isValidEndDate(row.variationEndDate))
    .sort((a, b) => a.variationDate.getTime() - b.variationDate.getTime());

  let previousEnd = baseEnd;
  for (const variation of sorted) {
    const variationEnd = startOfUtcDay(variation.variationEndDate!);
    const variationStart = startOfUtcDay(variation.variationDate);
    const extensionStart = previousEnd ? addUtcDays(previousEnd, 1) : variationStart;
    if (variationEnd >= extensionStart) {
      periods.push({ start: extensionStart, end: variationEnd });
      previousEnd = variationEnd;
    }
  }

  if (periods.length === 0 && !baseEnd) {
    return [];
  }

  return periods;
}

function tmMonthlyAmount(rate: number, unit: string | null, workingDays: number): number {
  if (workingDays <= 0) return 0;
  if (unit === "HOUR") return rate * workingDays * 8;
  return rate * workingDays;
}

export function forecastTmRevenueForYear(contract: ForecastContract, year: number): number {
  if (contract.type !== "T_AND_M" || contract.status !== "ACTIVE") return 0;
  const periods = forecastPeriods(contract.startDate, contract.endDate, contract.variations);
  let total = 0;
  for (const period of periods) {
    for (let month = 0; month < 12; month += 1) {
      const days = workingDaysInMonth(year, month, period.start, period.end);
      total += tmMonthlyAmount(contract.rate, contract.unit, days);
    }
  }
  return total;
}

export function forecastMilestoneRevenueForYear(contract: ForecastContract, year: number): number {
  if (contract.type === "T_AND_M" || contract.status !== "ACTIVE") return 0;
  return contract.milestones
    .filter((row) => row.milestoneDate.getUTCFullYear() === year)
    .reduce((sum, row) => sum + row.amount, 0);
}

export function forecastRevenueForYear(contracts: ForecastContract[], year: number): number {
  return contracts.reduce((sum, contract) => {
    if (contract.type === "T_AND_M") {
      return sum + forecastTmRevenueForYear(contract, year);
    }
    return sum + forecastMilestoneRevenueForYear(contract, year);
  }, 0);
}

export function forecastRevenueByClientForYear(
  contracts: ForecastContract[],
  year: number,
): Array<{ clientId: string; clientName: string; forecast: number }> {
  const map = new Map<string, { clientId: string; clientName: string; forecast: number }>();
  for (const contract of contracts) {
    const value =
      contract.type === "T_AND_M"
        ? forecastTmRevenueForYear(contract, year)
        : forecastMilestoneRevenueForYear(contract, year);
    if (value <= 0) continue;
    const existing = map.get(contract.clientId);
    if (existing) {
      existing.forecast += value;
    } else {
      map.set(contract.clientId, { clientId: contract.clientId, clientName: contract.clientName, forecast: value });
    }
  }
  return [...map.values()].sort((a, b) => b.forecast - a.forecast);
}

export function actualRevenueForYear(invoices: ForecastInvoice[], year: number): number {
  return invoices
    .filter((row) => row.status !== "CANCELED" && row.dueDate.getUTCFullYear() === year)
    .reduce((sum, row) => sum + row.amount, 0);
}

export function actualRevenueByClientForYear(
  invoices: ForecastInvoice[],
  year: number,
): Array<{ clientId: string; clientName: string; actual: number }> {
  const map = new Map<string, { clientId: string; clientName: string; actual: number }>();
  for (const invoice of invoices) {
    if (invoice.status === "CANCELED" || invoice.dueDate.getUTCFullYear() !== year) continue;
    const existing = map.get(invoice.clientId);
    if (existing) {
      existing.actual += invoice.amount;
    } else {
      map.set(invoice.clientId, {
        clientId: invoice.clientId,
        clientName: invoice.clientName,
        actual: invoice.amount,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.actual - a.actual);
}

export function resolveContractExpiryDate(
  endDate: Date | null,
  variations: Array<{ variationEndDate: Date | null }>,
): Date | null {
  const withEnd = variations
    .filter((row) => row.variationEndDate && isValidEndDate(row.variationEndDate))
    .sort((a, b) => b.variationEndDate!.getTime() - a.variationEndDate!.getTime());
  if (withEnd.length > 0) return withEnd[0]!.variationEndDate;
  return isValidEndDate(endDate) ? endDate : null;
}

export function isDateInMonth(date: Date, year: number, month: number): boolean {
  return date.getUTCFullYear() === year && date.getUTCMonth() === month;
}
