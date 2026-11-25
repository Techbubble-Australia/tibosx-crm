"use client";

/**
 * Sales → Dashboard — wireframe PDF page 1 (“Sales dashboard”).
 * My day is PDF page 2 at /sales/my-day (Home for sales).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type PipelineStageRow = {
  stageId: string | null;
  stageName: string;
  order: number;
  count: number;
  amount: number;
};
type NeedsAttentionOpp = {
  id: string;
  name: string;
  clientName: string;
  amount: number;
  currency: string;
  stageName: string | null;
  reason?: string;
  idleDays?: number;
};
type NeedsAttentionContract = {
  id: string;
  contractNumber: string;
  title: string;
  clientName: string;
  expiryDate: string | null;
};
type ForecastMonthRow = { month: number; label: string; forecast: number; actual: number };
type ClientAmount = { clientId: string; clientName: string; amount: number };

type SalesDashboardStats = {
  year: number;
  baseCurrency: string;
  forecastScope?: "ytd" | "full_year";
  kpis?: {
    openPipelineAmount: number;
    openOpportunityCount: number;
    weightedForecast: number;
    winRateLast90Days: number | null;
    wonCountLast90Days: number;
    lostCountLast90Days: number;
    avgSalesCycleDays: number | null;
    avgSalesCycleDeltaDays?: number | null;
    activeContracts: number;
    contractsExpiringThisMonth: number;
  };
  needsAttention?: {
    opportunitiesMissingNextStep: NeedsAttentionOpp[];
    opportunitiesIdle?: NeedsAttentionOpp[];
    opportunitiesCloseDatePassed?: NeedsAttentionOpp[];
    contractsExpiringSoon: NeedsAttentionContract[];
  };
  pipelineByStage?: PipelineStageRow[];
  actuals: {
    amountOwedByClient: ClientAmount[];
  };
  forecast: {
    forecastedRevenueThisYear: number;
    actualRevenueThisYear: number;
    forecastByMonth: ForecastMonthRow[];
    quarterTarget?: {
      label: string;
      actual: number;
      target: number;
    };
  };
};

const BASE_CURRENCIES = ["AUD", "USD", "INR"] as const;

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function moneyShort(value: number, currency: string) {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    const prefix =
      currency === "AUD" ? "A$" : currency === "USD" ? "US$" : `${currency} `;
    return `${prefix}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}k`;
  }
  return money(value, currency);
}

function pct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function fiscalLabel(year: number) {
  return `FY${year}-${String(year + 1).slice(2)}`;
}

function currentQuarterMeta(now = new Date()) {
  const month = now.getMonth(); // 0-11
  const q = Math.floor(month / 3) + 1;
  const startMonth = (q - 1) * 3;
  const labels = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"];
  return { q, startMonth, endMonth: startMonth + 2, label: `Q${q} (${labels[q - 1]})` };
}

export default function SalesDashboardPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [baseCurrency, setBaseCurrency] = useState("AUD");
  const [stats, setStats] = useState<SalesDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback((year: number, currency: string) => {
    setLoading(true);
    void adminFetch(
      `/api/admin/sales-dashboard/stats?year=${year}&baseCurrency=${encodeURIComponent(currency)}`,
    )
      .then((res) => res.json())
      .then((data) => setStats(data.data as SalesDashboardStats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats(selectedYear, baseCurrency);
  }, [loadStats, selectedYear, baseCurrency]);

  const currency = stats?.baseCurrency ?? baseCurrency;
  const kpis = stats?.kpis;
  const stages = stats?.pipelineByStage ?? [];
  const stageMax = useMemo(() => Math.max(...stages.map((s) => s.amount), 1), [stages]);
  const months = stats?.forecast.forecastByMonth ?? [];
  const owed = stats?.actuals.amountOwedByClient ?? [];
  const missingNext = stats?.needsAttention?.opportunitiesMissingNextStep ?? [];
  const idle = stats?.needsAttention?.opportunitiesIdle ?? [];
  const closePassed = stats?.needsAttention?.opportunitiesCloseDatePassed ?? [];
  const expiring = stats?.needsAttention?.contractsExpiringSoon ?? [];

  const qMeta = useMemo(() => currentQuarterMeta(), []);
  const quarterMonths = months.filter((m) => m.month >= qMeta.startMonth && m.month <= qMeta.endMonth);
  const quarterActual = quarterMonths.reduce((s, m) => s + m.actual, 0);
  const quarterTarget = quarterMonths.reduce((s, m) => s + m.forecast, 0);
  const quarterGap = Math.max(0, quarterTarget - quarterActual);
  const cover =
    quarterGap > 0 && (kpis?.weightedForecast ?? 0) > 0
      ? ((kpis?.weightedForecast ?? 0) / quarterGap).toFixed(1)
      : null;

  // Forecast vs actual panel: show recent/upcoming months around now for current year
  const forecastMonths = useMemo(() => {
    if (selectedYear !== currentYear) return months;
    const nowM = new Date().getMonth();
    const start = Math.max(0, nowM - 3);
    const end = Math.min(11, nowM + 1);
    return months.filter((m) => m.month >= start && m.month <= end);
  }, [months, selectedYear, currentYear]);

  function exportCsv() {
    const lines = [
      "metric,value",
      `open_pipeline,${kpis?.openPipelineAmount ?? 0}`,
      `weighted_forecast,${kpis?.weightedForecast ?? 0}`,
      `win_rate_90d,${kpis?.winRateLast90Days ?? ""}`,
      `avg_sales_cycle_days,${kpis?.avgSalesCycleDays ?? ""}`,
      `active_contracts,${kpis?.activeContracts ?? 0}`,
      ...stages.map((s) => `stage_${s.stageName.replace(/,/g, " ")},${s.amount}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-dashboard-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Sales dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pipeline, forecast and targets for {fiscalLabel(selectedYear)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              Year
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              Currency
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-900"
              >
                {BASE_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <Link
              href="/opportunities/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              <Plus className="h-4 w-4" />
              Opportunity
            </Link>
          </div>
        </div>

        {loading && !stats ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                {
                  label: "Open pipeline",
                  value: money(kpis?.openPipelineAmount ?? 0, currency),
                  detail: `${kpis?.openOpportunityCount ?? 0} opportunities`,
                  href: "/opportunities",
                },
                {
                  label: "Weighted forecast",
                  value: money(kpis?.weightedForecast ?? 0, currency),
                  detail: "probability-adjusted",
                  href: "/opportunities/forecast",
                },
                {
                  label: "Win rate (90 days)",
                  value: pct(kpis?.winRateLast90Days),
                  detail: `${kpis?.wonCountLast90Days ?? 0} won, ${kpis?.lostCountLast90Days ?? 0} lost`,
                  href: "/sales/reports",
                },
                {
                  label: "Avg sales cycle",
                  value:
                    kpis?.avgSalesCycleDays != null ? `${Math.round(kpis.avgSalesCycleDays)} days` : "—",
                  detail:
                    kpis?.avgSalesCycleDeltaDays != null
                      ? `${kpis.avgSalesCycleDeltaDays < 0 ? "down" : "up"} ${Math.abs(Math.round(kpis.avgSalesCycleDeltaDays))} days`
                      : "won deals (created → close)",
                  href: "/opportunities/list",
                },
                {
                  label: "Active contracts",
                  value: String(kpis?.activeContracts ?? 0),
                  detail: `${kpis?.contractsExpiringThisMonth ?? 0} expiring this month`,
                  href: "/contracts/active",
                },
              ].map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800/60"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{card.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{card.detail}</p>
                </Link>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pipeline by stage</h2>
                    <p className="text-xs text-gray-500">Click a bar to open the filtered board</p>
                  </div>
                  {!stages.length ? (
                    <p className="text-sm text-gray-400">No open pipeline yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {stages.map((stage) => (
                        <Link
                          key={stage.stageId ?? stage.stageName}
                          href={
                            stage.stageId
                              ? `/opportunities?stageId=${encodeURIComponent(stage.stageId)}`
                              : "/opportunities"
                          }
                          className="block"
                        >
                          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{stage.stageName}</span>
                            <span className="tabular-nums text-gray-600 dark:text-gray-400">
                              {money(stage.amount, currency)}
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full rounded-full bg-gray-900 dark:bg-white"
                              style={{ width: `${(stage.amount / stageMax) * 100}%` }}
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Forecast vs actual, {selectedYear}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Planned contract revenue vs invoices issued (existing TIBOSX view, kept)
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    {forecastMonths.map((m) => {
                      const max = Math.max(m.forecast, m.actual, 1);
                      return (
                        <div key={m.month} className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-2 text-xs">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{m.label}</span>
                          <div className="space-y-1">
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className="h-full rounded-full bg-gray-400"
                                style={{ width: `${(m.forecast / max) * 100}%` }}
                              />
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className="h-full rounded-full bg-gray-900 dark:bg-white"
                                style={{ width: `${(m.actual / max) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="tabular-nums text-gray-500">
                            {moneyShort(m.actual, currency)} of {moneyShort(m.forecast, currency)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Target: {qMeta.label}
                  </h2>
                  <p className="mt-3 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {moneyShort(quarterActual, currency)} of {moneyShort(quarterTarget, currency)}
                  </p>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width: `${quarterTarget > 0 ? Math.min(100, (quarterActual / quarterTarget) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Gap {moneyShort(quarterGap, currency)}
                    {cover ? `. Weighted pipeline covers ${cover}x of the gap.` : "."}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Needs attention</h2>
                    <p className="text-xs text-gray-500">Rules run per workspace</p>
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    {missingNext.slice(0, 5).map((o) => (
                      <li key={`ns-${o.id}`} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-800 dark:bg-red-900/40 dark:text-red-200">
                          No next step
                        </span>
                        <Link href={`/opportunities/${o.id}`} className="font-medium text-gray-900 hover:underline dark:text-gray-100">
                          {o.name}
                        </Link>
                      </li>
                    ))}
                    {idle.slice(0, 4).map((o) => (
                      <li key={`idle-${o.id}`} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          Idle {o.idleDays ?? "?"} days
                        </span>
                        <Link href={`/opportunities/${o.id}`} className="font-medium text-gray-900 hover:underline dark:text-gray-100">
                          {o.name}
                        </Link>
                      </li>
                    ))}
                    {closePassed.slice(0, 4).map((o) => (
                      <li key={`cd-${o.id}`} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-800 dark:bg-red-900/40 dark:text-red-200">
                          Close date passed
                        </span>
                        <Link href={`/opportunities/${o.id}`} className="font-medium text-gray-900 hover:underline dark:text-gray-100">
                          {o.name}
                        </Link>
                      </li>
                    ))}
                    {expiring.slice(0, 4).map((c) => (
                      <li key={c.id} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                          Contract expiring
                        </span>
                        <Link href={`/contracts/${c.id}`} className="font-medium text-gray-900 hover:underline dark:text-gray-100">
                          {c.contractNumber} {c.clientName}
                          {c.expiryDate
                            ? `, ${new Date(c.expiryDate).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`
                            : ""}
                        </Link>
                      </li>
                    ))}
                    {!missingNext.length && !idle.length && !closePassed.length && !expiring.length ? (
                      <li className="text-gray-400">Nothing needs attention right now.</li>
                    ) : null}
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Amount owed by client</h2>
                  </div>
                  {!owed.length ? (
                    <p className="text-sm text-gray-400">No outstanding amounts.</p>
                  ) : (
                    <ul className="space-y-2">
                      {owed.slice(0, 8).map((row) => {
                        const maxOwed = Math.max(...owed.slice(0, 8).map((r) => r.amount), 1);
                        return (
                          <li key={row.clientId}>
                            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                              <Link
                                href={`/invoices?clientId=${encodeURIComponent(row.clientId)}`}
                                className="font-medium text-gray-900 hover:underline dark:text-gray-100"
                              >
                                {row.clientName}
                              </Link>
                              <span className="tabular-nums text-gray-600 dark:text-gray-400">
                                {money(row.amount, currency)}
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className="h-full rounded-full bg-gray-800 dark:bg-gray-200"
                                style={{ width: `${(row.amount / maxOwed) * 100}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
