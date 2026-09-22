import type { ContractType } from "./contract-types";
import { countWorkingDaysInRange } from "./working-days-calendar";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type ForecastMonthRow = {
  month: number;
  label: string;
  forecast: number;
  actual: number;
};

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

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isValidEndDate(endDate: Date | null | undefined): boolean {
  if (!endDate) return false;
  return endDate.getUTCFullYear() >= 1971;
}

export function workingDaysInRange(start: Date, end: Date, country = ""): number {
  const from = startOfUtcDay(start);
  const to = startOfUtcDay(end);
  if (to < from) return 0;
  return countWorkingDaysInRange(from, to, country);
}

export function workingDaysInMonth(
  year: number,
  month: number,
  rangeStart: Date,
  rangeEnd: Date,
  country = "",
): number {
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0));
  const from = startOfUtcDay(rangeStart);
  const to = startOfUtcDay(rangeEnd);
  const start = from > monthStart ? from : monthStart;
  const end = to < monthEnd ? to : monthEnd;
  if (end < start) return 0;
  return workingDaysInRange(start, end, country);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function yearBounds(year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year, 11, 31)),
  };
}

/** Intersect a date range with a calendar year (inclusive, UTC days). */
export function clipRangeToYear(
  rangeStart: Date,
  rangeEnd: Date,
  year: number,
): { start: Date; end: Date } | null {
  const { start: yearStart, end: yearEnd } = yearBounds(year);
  const start = startOfUtcDay(rangeStart);
  const end = startOfUtcDay(rangeEnd);
  const clippedStart = start > yearStart ? start : yearStart;
  const clippedEnd = end < yearEnd ? end : yearEnd;
  if (clippedEnd < clippedStart) return null;
  return { start: clippedStart, end: clippedEnd };
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

function tmWorkingDaysInYear(
  contract: ForecastContract,
  year: number,
  month?: number,
): number {
  const periods = forecastPeriods(contract.startDate, contract.endDate, contract.variations);
  const country = contract.clientCountry || "Australia";
  let total = 0;
  for (const period of periods) {
    if (month === undefined) {
      const clipped = clipRangeToYear(period.start, period.end, year);
      if (!clipped) continue;
      total += workingDaysInRange(clipped.start, clipped.end, country);
    } else {
      total += workingDaysInMonth(year, month, period.start, period.end, country);
    }
  }
  return total;
}

export function forecastTmRevenueForMonth(contract: ForecastContract, year: number, month: number): number {
  if (contract.type !== "T_AND_M" || contract.status !== "ACTIVE") return 0;
  const days = tmWorkingDaysInYear(contract, year, month);
  return tmMonthlyAmount(contract.rate, contract.unit, days);
}

export function forecastTmRevenueForYear(contract: ForecastContract, year: number): number {
  if (contract.type !== "T_AND_M" || contract.status !== "ACTIVE") return 0;
  const days = tmWorkingDaysInYear(contract, year);
  return tmMonthlyAmount(contract.rate, contract.unit, days);
}

export function forecastMilestoneRevenueForYear(contract: ForecastContract, year: number): number {
  if (contract.type === "T_AND_M" || contract.status !== "ACTIVE") return 0;
  return contract.milestones
    .filter((row) => row.milestoneDate.getUTCFullYear() === year)
    .reduce((sum, row) => sum + row.amount, 0);
}

export function forecastMilestoneRevenueForMonth(
  contract: ForecastContract,
  year: number,
  month: number,
): number {
  if (contract.type === "T_AND_M" || contract.status !== "ACTIVE") return 0;
  return contract.milestones
    .filter(
      (row) =>
        row.milestoneDate.getUTCFullYear() === year && row.milestoneDate.getUTCMonth() === month,
    )
    .reduce((sum, row) => sum + row.amount, 0);
}

function forecastRevenueForMonth(contracts: ForecastContract[], year: number, month: number): number {
  return contracts.reduce((sum, contract) => {
    if (contract.type === "T_AND_M") {
      return sum + forecastTmRevenueForMonth(contract, year, month);
    }
    return sum + forecastMilestoneRevenueForMonth(contract, year, month);
  }, 0);
}

export function actualRevenueForMonth(invoices: ForecastInvoice[], year: number, month: number): number {
  return invoices
    .filter(
      (row) =>
        row.status !== "CANCELED" &&
        row.dueDate.getUTCFullYear() === year &&
        row.dueDate.getUTCMonth() === month,
    )
    .reduce((sum, row) => sum + row.amount, 0);
}

export function forecastRevenueByMonthForYear(
  contracts: ForecastContract[],
  invoices: ForecastInvoice[],
  year: number,
): ForecastMonthRow[] {
  return MONTH_LABELS.map((label, month) => ({
    month,
    label,
    forecast: forecastRevenueForMonth(contracts, year, month),
    actual: actualRevenueForMonth(invoices, year, month),
  }));
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
