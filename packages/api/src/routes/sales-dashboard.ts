import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import type { ContractType } from "../lib/contract-types";
import {
  actualRevenueByClientForYear,
  actualRevenueForYear,
  forecastRevenueByClientForYear,
  forecastRevenueForYear,
  isDateInMonth,
  resolveContractExpiryDate,
  type ForecastContract,
  type ForecastInvoice,
} from "../lib/sales-forecast";

const router: IRouter = Router();

function toNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

function isValidEndDate(endDate: Date | null | undefined): boolean {
  if (!endDate) return false;
  return endDate.getUTCFullYear() >= 1971;
}

router.get("/stats", async (_req, res) => {
  try {
    const now = new Date();
    const year = now.getUTCFullYear();
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
          variations: { select: { variationDate: true, variationEndDate: true } },
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
      const amount = toNumber(row.totalAmount);
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
      variations: row.variations.map((v) => ({
        variationDate: v.variationDate,
        variationEndDate: v.variationEndDate,
      })),
      milestones: row.milestones.map((m) => ({
        milestoneDate: m.milestoneDate,
        amount: toNumber(m.amount),
      })),
    }));

    const forecastInvoices: ForecastInvoice[] = invoices.map((row) => ({
      amount: toNumber(row.amount),
      totalAmount: toNumber(row.totalAmount),
      dueDate: row.dueDate,
      status: row.status,
      clientId: row.contract.clientId,
      clientName: row.contract.client.name,
      currency: row.currency,
    }));

    const forecastByClient = forecastRevenueByClientForYear(forecastContracts, year);
    const actualByClient = actualRevenueByClientForYear(forecastInvoices, year);
    const clientIds = new Set([...forecastByClient.map((r) => r.clientId), ...actualByClient.map((r) => r.clientId)]);
    const forecastVsActualByClient = [...clientIds].map((clientId) => {
      const forecastRow = forecastByClient.find((r) => r.clientId === clientId);
      const actualRow = actualByClient.find((r) => r.clientId === clientId);
      return {
        clientId,
        clientName: forecastRow?.clientName ?? actualRow?.clientName ?? "Unknown",
        forecast: forecastRow?.forecast ?? 0,
        actual: actualRow?.actual ?? 0,
      };
    }).sort((a, b) => b.forecast + b.actual - (a.forecast + a.actual));

    res.json({
      data: {
        year,
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
          forecastedRevenueThisYear: forecastRevenueForYear(forecastContracts, year),
          actualRevenueThisYear: actualRevenueForYear(forecastInvoices, year),
          forecastVsActualByClient,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching sales dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch sales dashboard stats" });
  }
});

export { router as salesDashboardRoutes };
