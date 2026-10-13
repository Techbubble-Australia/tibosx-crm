import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import { expirePastDueContracts } from "../lib/contract-expiry";
import type { ContractType } from "../lib/contract-types";
import {
  forecastMilestoneRevenueForMonth,
  forecastMilestoneRevenueForYear,
  forecastTmRevenueForMonth,
  forecastTmRevenueForYear,
  isDateInMonth,
  resolveContractExpiryDate,
  type ForecastContract,
  type ForecastInvoice,
} from "../lib/sales-forecast";
import {
  convertCurrency,
  DASHBOARD_BASE_CURRENCIES,
  getExchangeRatesFromBase,
  type DashboardBaseCurrency,
} from "../lib/exchange-rates";

const router: IRouter = Router();

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

function isValidEndDate(endDate: Date | null | undefined): boolean {
  if (!endDate) return false;
  return endDate.getUTCFullYear() >= 1971;
}

function parseForecastYear(queryYear: unknown, now: Date): number {
  const currentYear = now.getUTCFullYear();
  if (typeof queryYear !== "string" || !/^\d{4}$/.test(queryYear.trim())) {
    return currentYear;
  }
  const year = Number.parseInt(queryYear, 10);
  if (year < currentYear - 5 || year > currentYear + 5) {
    return currentYear;
  }
  return year;
}

function parseBaseCurrency(queryCurrency: unknown): DashboardBaseCurrency {
  if (typeof queryCurrency !== "string") return "AUD";
  const normalized = queryCurrency.trim().toUpperCase();
  if (DASHBOARD_BASE_CURRENCIES.includes(normalized as DashboardBaseCurrency)) {
    return normalized as DashboardBaseCurrency;
  }
  return "AUD";
}

function toBase(
  amount: number,
  from: string,
  base: string,
  rates: Record<string, number>,
): number {
  return convertCurrency(amount, from, base, base, rates);
}

function forecastContractForYear(
  contract: ForecastContract,
  year: number,
  base: string,
  rates: Record<string, number>,
): number {
  const raw =
    contract.type === "T_AND_M"
      ? forecastTmRevenueForYear(contract, year)
      : forecastMilestoneRevenueForYear(contract, year);
  return toBase(raw, contract.currency, base, rates);
}

function forecastContractForMonth(
  contract: ForecastContract,
  year: number,
  month: number,
  base: string,
  rates: Record<string, number>,
): number {
  const raw =
    contract.type === "T_AND_M"
      ? forecastTmRevenueForMonth(contract, year, month)
      : forecastMilestoneRevenueForMonth(contract, year, month);
  return toBase(raw, contract.currency, base, rates);
}

router.get("/stats", async (req, res) => {
  try {
    await expirePastDueContracts();
    const now = new Date();
    const year = parseForecastYear(req.query.year, now);
    const baseCurrency = parseBaseCurrency(req.query.baseCurrency);
    const rates = await getExchangeRatesFromBase(baseCurrency);
    const thisMonth = now.getUTCMonth();
    const nextMonth = thisMonth === 11 ? 0 : thisMonth + 1;
    const nextMonthYear = thisMonth === 11 ? year + 1 : year;

    const [activeOpportunities, activeContracts, contracts, invoices] = await Promise.all([
      prisma.opportunity.count({ where: { active: true } }),
      prisma.contract.count({ where: { status: "ACTIVE" } }),
      prisma.contract.findMany({
        where: { status: "ACTIVE" },
        include: {
          client: { select: { id: true, name: true, country: true } },
          workUnitMonths: { orderBy: [{ year: "asc" }, { month: "asc" }] },
          variations: {
            select: {
              id: true,
              variationDate: true,
              variationEndDate: true,
              rate: true,
            },
          },
          milestones: { select: { milestoneDate: true, amount: true } },
        },
      }),
      prisma.contractInvoice.findMany({
        include: {
          contract: {
            select: {
              clientId: true,
              client: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    const expiringThisMonth = contracts.filter((row) => {
      const expiry = resolveContractExpiryDate(row.endDate, row.variations);
      return expiry && isDateInMonth(expiry, year, thisMonth);
    }).length;

    const expiringNextMonth = contracts.filter((row) => {
      const expiry = resolveContractExpiryDate(row.endDate, row.variations);
      return expiry && isDateInMonth(expiry, nextMonthYear, nextMonth);
    }).length;

    const invoicesAwaitingPayment = invoices.filter((row) => row.status === "AWAITING_PAYMENT").length;

    const activeContractsByClient = new Map<string, { clientId: string; clientName: string; count: number }>();
    for (const row of contracts) {
      const clientId = row.clientId;
      const clientName = row.client.name;
      const existing = activeContractsByClient.get(clientId);
      if (existing) {
        existing.count += 1;
      } else {
        activeContractsByClient.set(clientId, { clientId, clientName, count: 1 });
      }
    }

    const amountOwedByClient = new Map<string, { clientId: string; clientName: string; amount: number }>();
    for (const row of invoices) {
      if (row.status !== "DRAFT" && row.status !== "AWAITING_PAYMENT") continue;
      const clientId = row.contract.clientId;
      const clientName = row.contract.client.name;
      const amount = toBase(toNumber(row.totalAmount), row.currency, baseCurrency, rates);
      const existing = amountOwedByClient.get(clientId);
      if (existing) {
        existing.amount += amount;
      } else {
        amountOwedByClient.set(clientId, { clientId, clientName, amount });
      }
    }

    const forecastContracts: ForecastContract[] = contracts.map((row) => ({
      id: row.id,
      type: row.type as ContractType,
      status: row.status,
      startDate: row.startDate,
      endDate: isValidEndDate(row.endDate) ? row.endDate : null,
      rate: toNumber(row.rate),
      unit: row.unit,
      currency: row.currency,
      clientId: row.clientId,
      clientName: row.client.name,
      clientCountry: row.client.country,
      workUnitMonths: row.workUnitMonths
        .filter((w) => w.segmentKey === "base")
        .map((w) => ({ year: w.year, month: w.month, workUnits: toNumber(w.workUnits) })),
      variations: row.variations.map((v) => ({
        variationDate: v.variationDate,
        variationEndDate: v.variationEndDate,
        rate: v.rate == null ? null : toNumber(v.rate),
        workUnitMonths: row.workUnitMonths
          .filter((w) => w.segmentKey === v.id)
          .map((w) => ({ year: w.year, month: w.month, workUnits: toNumber(w.workUnits) })),
      })),
      milestones: row.milestones.map((m) => ({
        milestoneDate: m.milestoneDate,
        amount: toNumber(m.amount),
      })),
    }));

    const forecastInvoices: ForecastInvoice[] = invoices.map((row) => ({
      amount: toNumber(row.amount),
      totalAmount: toNumber(row.totalAmount),
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      status: row.status,
      clientId: row.contract.clientId,
      clientName: row.contract.client.name,
      currency: row.currency,
    }));

    const forecastByClientMap = new Map<string, { clientId: string; clientName: string; forecast: number }>();
    for (const contract of forecastContracts) {
      const value = forecastContractForYear(contract, year, baseCurrency, rates);
      if (value <= 0) continue;
      const existing = forecastByClientMap.get(contract.clientId);
      if (existing) {
        existing.forecast += value;
      } else {
        forecastByClientMap.set(contract.clientId, {
          clientId: contract.clientId,
          clientName: contract.clientName,
          forecast: value,
        });
      }
    }

    const actualByClientMap = new Map<string, { clientId: string; clientName: string; actual: number }>();
    for (const invoice of forecastInvoices) {
      if (invoice.status === "CANCELED" || invoice.issueDate.getUTCFullYear() !== year) continue;
      const value = toBase(invoice.amount, invoice.currency, baseCurrency, rates);
      const existing = actualByClientMap.get(invoice.clientId);
      if (existing) {
        existing.actual += value;
      } else {
        actualByClientMap.set(invoice.clientId, {
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          actual: value,
        });
      }
    }

    const clientIds = new Set([...forecastByClientMap.keys(), ...actualByClientMap.keys()]);
    const forecastVsActualByClient = [...clientIds]
      .map((clientId) => {
        const forecastRow = forecastByClientMap.get(clientId);
        const actualRow = actualByClientMap.get(clientId);
        return {
          clientId,
          clientName: forecastRow?.clientName ?? actualRow?.clientName ?? "Unknown",
          forecast: forecastRow?.forecast ?? 0,
          actual: actualRow?.actual ?? 0,
        };
      })
      .sort((a, b) => b.forecast + b.actual - (a.forecast + a.actual));

    const forecastedRevenueThisYear = forecastContracts.reduce(
      (sum, contract) => sum + forecastContractForYear(contract, year, baseCurrency, rates),
      0,
    );

    const actualRevenueThisYear = forecastInvoices
      .filter((row) => row.status !== "CANCELED" && row.issueDate.getUTCFullYear() === year)
      .reduce((sum, row) => sum + toBase(row.amount, row.currency, baseCurrency, rates), 0);

    const forecastByMonth = MONTH_LABELS.map((label, month) => ({
      month,
      label,
      forecast: forecastContracts.reduce(
        (sum, contract) => sum + forecastContractForMonth(contract, year, month, baseCurrency, rates),
        0,
      ),
      actual: forecastInvoices
        .filter(
          (row) =>
            row.status !== "CANCELED" &&
            row.issueDate.getUTCFullYear() === year &&
            row.issueDate.getUTCMonth() === month,
        )
        .reduce((sum, row) => sum + toBase(row.amount, row.currency, baseCurrency, rates), 0),
    }));

    res.json({
      data: {
        year,
        baseCurrency,
        actuals: {
          activeOpportunities,
          activeContracts,
          contractsExpiringThisMonth: expiringThisMonth,
          contractsExpiringNextMonth: expiringNextMonth,
          invoicesAwaitingPayment,
          activeContractsByClient: [...activeContractsByClient.values()].sort((a, b) => b.count - a.count),
          amountOwedByClient: [...amountOwedByClient.values()].sort((a, b) => b.amount - a.amount),
        },
        forecast: {
          forecastedRevenueThisYear,
          actualRevenueThisYear,
          forecastVsActualByClient,
          forecastByMonth,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching sales dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch sales dashboard stats" });
  }
});

export { router as salesDashboardRoutes };
