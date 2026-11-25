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

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);

    const [
      activeOpportunities,
      activeContracts,
      contracts,
      invoices,
      openOpportunities,
      closedRecent,
      wonPriorWindow,
    ] = await Promise.all([
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
        prisma.opportunity.findMany({
          where: {
            active: true,
            OR: [{ stageId: null }, { stage: { stageType: "open" } }],
          },
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            probability: true,
            nextStep: true,
            nextStepDue: true,
            customFields: true,
            createdAt: true,
            updatedAt: true,
            client: { select: { id: true, name: true } },
            stage: {
              select: {
                id: true,
                name: true,
                stageType: true,
                winProbability: true,
                order: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 500,
        }),
        prisma.opportunity.findMany({
          where: {
            updatedAt: { gte: ninetyDaysAgo },
            stage: { stageType: { in: ["won", "lost"] } },
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            stage: { select: { stageType: true } },
          },
        }),
        prisma.opportunity.findMany({
          where: {
            updatedAt: {
              gte: new Date(now.getTime() - 180 * 86400000),
              lt: ninetyDaysAgo,
            },
            stage: { stageType: "won" },
          },
          select: { createdAt: true, updatedAt: true },
          take: 200,
        }),
      ]);

    const expiringThisMonthRows = contracts.filter((row) => {
      const expiry = resolveContractExpiryDate(row.endDate, row.variations);
      return expiry && isDateInMonth(expiry, year, thisMonth);
    });
    const expiringThisMonth = expiringThisMonthRows.length;

    const expiringNextMonthRows = contracts.filter((row) => {
      const expiry = resolveContractExpiryDate(row.endDate, row.variations);
      return expiry && isDateInMonth(expiry, nextMonthYear, nextMonth);
    });
    const expiringNextMonth = expiringNextMonthRows.length;

    const invoicesAwaitingPayment = invoices.filter((row) => row.status === "AWAITING_PAYMENT").length;

    let openPipelineAmount = 0;
    let weightedForecast = 0;
    const pipelineByStageMap = new Map<
      string,
      { stageId: string | null; stageName: string; order: number; count: number; amount: number }
    >();
    const needsAttentionOpps: Array<{
      id: string;
      name: string;
      clientName: string;
      amount: number;
      currency: string;
      stageName: string | null;
    }> = [];
    const idleOpps: Array<{
      id: string;
      name: string;
      clientName: string;
      amount: number;
      currency: string;
      stageName: string | null;
      idleDays: number;
    }> = [];
    const closeDatePassedOpps: Array<{
      id: string;
      name: string;
      clientName: string;
      amount: number;
      currency: string;
      stageName: string | null;
    }> = [];

    function parseCloseDate(customFields: unknown): Date | null {
      if (!customFields || typeof customFields !== "object" || Array.isArray(customFields)) return null;
      const record = customFields as Record<string, unknown>;
      const raw = record.closeDate ?? record.expectedCloseDate ?? record.close_date ?? record.expected_close_date;
      if (typeof raw !== "string" && typeof raw !== "number") return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    for (const opp of openOpportunities) {
      const amount = toBase(toNumber(opp.amount), opp.currency, baseCurrency, rates);
      openPipelineAmount += amount;
      const winProb = opp.probability ?? opp.stage?.winProbability ?? 0;
      weightedForecast += amount * (winProb / 100);

      const stageKey = opp.stage?.id ?? "__none__";
      const stageName = opp.stage?.name ?? "No stage";
      const stageOrder = opp.stage?.order ?? 999;
      const existingStage = pipelineByStageMap.get(stageKey);
      if (existingStage) {
        existingStage.count += 1;
        existingStage.amount += amount;
      } else {
        pipelineByStageMap.set(stageKey, {
          stageId: opp.stage?.id ?? null,
          stageName,
          order: stageOrder,
          count: 1,
          amount,
        });
      }

      if (!opp.nextStep?.trim()) {
        needsAttentionOpps.push({
          id: opp.id,
          name: opp.name,
          clientName: opp.client.name,
          amount,
          currency: baseCurrency,
          stageName: opp.stage?.name ?? null,
        });
      }

      const idleMs = now.getTime() - opp.updatedAt.getTime();
      const idleDays = Math.floor(idleMs / 86400000);
      if (idleDays >= 7 && opp.nextStep?.trim()) {
        idleOpps.push({
          id: opp.id,
          name: opp.name,
          clientName: opp.client.name,
          amount,
          currency: baseCurrency,
          stageName: opp.stage?.name ?? null,
          idleDays,
        });
      }

      const closeDate = parseCloseDate(opp.customFields) ?? (opp.nextStepDue && winProb >= 50 ? opp.nextStepDue : null);
      if (closeDate && closeDate < now) {
        closeDatePassedOpps.push({
          id: opp.id,
          name: opp.name,
          clientName: opp.client.name,
          amount,
          currency: baseCurrency,
          stageName: opp.stage?.name ?? null,
        });
      }
    }

    idleOpps.sort((a, b) => b.idleDays - a.idleDays);

    const wonCount = closedRecent.filter((row) => row.stage?.stageType === "won").length;
    const lostCount = closedRecent.filter((row) => row.stage?.stageType === "lost").length;
    const closedTotal = wonCount + lostCount;
    const winRateLast90Days = closedTotal > 0 ? wonCount / closedTotal : null;

    function avgCycleDays(rows: Array<{ createdAt: Date; updatedAt: Date }>): number | null {
      const won = rows.filter((row) => row.updatedAt > row.createdAt);
      if (!won.length) return null;
      const total = won.reduce((sum, row) => sum + (row.updatedAt.getTime() - row.createdAt.getTime()) / 86400000, 0);
      return total / won.length;
    }
    const wonRecent = closedRecent.filter((row) => row.stage?.stageType === "won");
    const avgSalesCycleDays = avgCycleDays(wonRecent);
    const priorAvg = avgCycleDays(wonPriorWindow);
    const avgSalesCycleDeltaDays =
      avgSalesCycleDays != null && priorAvg != null ? avgSalesCycleDays - priorAvg : null;

    const needsAttentionContracts = [...expiringThisMonthRows, ...expiringNextMonthRows]
      .slice(0, 20)
      .map((row) => {
        const expiry = resolveContractExpiryDate(row.endDate, row.variations);
        return {
          id: row.id,
          contractNumber: row.contractNumber,
          title: row.title,
          clientName: row.client.name,
          expiryDate: expiry ? expiry.toISOString() : null,
        };
      });

    const pipelineByStage = [...pipelineByStageMap.values()].sort((a, b) => a.order - b.order);

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

    // For the current year, compare forecast through the current month (YTD) with
    // invoices issued so far — not full-year planned capacity vs partial actuals.
    const isCurrentYear = year === now.getUTCFullYear();
    const forecastMonthEnd = isCurrentYear ? thisMonth : 11;

    function forecastThroughMonth(contract: ForecastContract): number {
      let total = 0;
      for (let month = 0; month <= forecastMonthEnd; month += 1) {
        total += forecastContractForMonth(contract, year, month, baseCurrency, rates);
      }
      return total;
    }

    function isCountableActual(status: string): boolean {
      return status !== "CANCELED" && status !== "DRAFT";
    }

    const forecastByClientMap = new Map<string, { clientId: string; clientName: string; forecast: number }>();
    for (const contract of forecastContracts) {
      const value = isCurrentYear
        ? forecastThroughMonth(contract)
        : forecastContractForYear(contract, year, baseCurrency, rates);
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
      if (!isCountableActual(invoice.status) || invoice.issueDate.getUTCFullYear() !== year) continue;
      if (isCurrentYear && invoice.issueDate.getUTCMonth() > thisMonth) continue;
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
      (sum, contract) =>
        sum +
        (isCurrentYear
          ? forecastThroughMonth(contract)
          : forecastContractForYear(contract, year, baseCurrency, rates)),
      0,
    );

    const actualRevenueThisYear = forecastInvoices
      .filter((row) => {
        if (!isCountableActual(row.status) || row.issueDate.getUTCFullYear() !== year) return false;
        if (isCurrentYear && row.issueDate.getUTCMonth() > thisMonth) return false;
        return true;
      })
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
            isCountableActual(row.status) &&
            row.issueDate.getUTCFullYear() === year &&
            row.issueDate.getUTCMonth() === month,
        )
        .reduce((sum, row) => sum + toBase(row.amount, row.currency, baseCurrency, rates), 0),
    }));

    res.json({
      data: {
        year,
        baseCurrency,
        forecastScope: isCurrentYear ? "ytd" : "full_year",
        kpis: {
          openPipelineAmount,
          openOpportunityCount: openOpportunities.length,
          weightedForecast,
          winRateLast90Days,
          wonCountLast90Days: wonCount,
          lostCountLast90Days: lostCount,
          avgSalesCycleDays,
          avgSalesCycleDeltaDays,
          activeContracts,
          contractsExpiringThisMonth: expiringThisMonth,
        },
        needsAttention: {
          opportunitiesMissingNextStep: needsAttentionOpps.slice(0, 15),
          opportunitiesIdle: idleOpps.slice(0, 15),
          opportunitiesCloseDatePassed: closeDatePassedOpps.slice(0, 15),
          contractsExpiringSoon: needsAttentionContracts,
        },
        pipelineByStage,
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
