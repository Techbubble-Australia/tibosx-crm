"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type ClientCount = { clientId: string; clientName: string; count: number };
type ClientAmount = { clientId: string; clientName: string; amount: number };
type ForecastVsActual = { clientId: string; clientName: string; forecast: number; actual: number };
type ForecastMonthRow = { month: number; label: string; forecast: number; actual: number };

const BASE_CURRENCIES = ["AUD", "USD", "INR"] as const;

type SalesDashboardStats = {
  year: number;
  baseCurrency: string;
  forecastScope?: "ytd" | "full_year";
  actuals: {
    activeOpportunities: number;
    activeContracts: number;
    contractsExpiringThisMonth: number;
    contractsExpiringNextMonth: number;
    invoicesAwaitingPayment: number;
    activeContractsByClient: ClientCount[];
    amountOwedByClient: ClientAmount[];
  };
  forecast: {
    forecastedRevenueThisYear: number;
    actualRevenueThisYear: number;
    forecastVsActualByClient: ForecastVsActual[];
    forecastByMonth: ForecastMonthRow[];
  };
};

function formatAmount(value: number, currency?: string) {
  if (currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function yearOptions(anchorYear: number) {
  return Array.from({ length: 7 }, (_, index) => anchorYear - 2 + index);
}

function BarChart({
  title,
  subtitle,
  items,
  labelKey,
  valueKey,
  getHref,
  currency,
}: {
  title: string;
  subtitle: string;
  items: Array<Record<string, string | number>>;
  labelKey: string;
  valueKey: string;
  getHref?: (item: Record<string, string | number>) => string | undefined;
  currency?: string;
}) {
  const max = useMemo(() => Math.max(...items.map((item) => Number(item[valueKey])), 1), [items, valueKey]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      {!items.length ? (
        <p className="text-sm text-gray-400">No data yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={String(item[labelKey])} className="grid grid-cols-[minmax(0,1fr)_1fr_auto] items-center gap-3">
              <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{String(item[labelKey])}</span>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-black dark:bg-white"
                  style={{ width: `${(Number(item[valueKey]) / max) * 100}%` }}
                />
              </div>
              <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
                {getHref?.(item) ? (
                  <Link href={getHref(item)!} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {currency ? formatAmount(Number(item[valueKey]), currency) : formatAmount(Number(item[valueKey]))}
                  </Link>
                ) : (
                  currency ? formatAmount(Number(item[valueKey]), currency) : formatAmount(Number(item[valueKey]))
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DualBarChart({
  title,
  subtitle,
  items,
  currency,
}: {
  title: string;
  subtitle: string;
  items: ForecastVsActual[];
  currency: string;
}) {
  const max = useMemo(
    () => Math.max(...items.map((item) => Math.max(item.forecast, item.actual)), 1),
    [items],
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      {!items.length ? (
        <p className="text-sm text-gray-400">No data yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.clientId} className="space-y-1">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{item.clientName}</p>
              <div className="grid grid-cols-[4rem_1fr_auto] items-center gap-2 text-xs">
                <span className="text-gray-500">Forecast</span>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${(item.forecast / max) * 100}%` }} />
                </div>
                <span className="tabular-nums text-gray-600">{formatAmount(item.forecast, currency)}</span>
              </div>
              <div className="grid grid-cols-[4rem_1fr_auto] items-center gap-2 text-xs">
                <span className="text-gray-500">Actual</span>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-green-600" style={{ width: `${(item.actual / max) * 100}%` }} />
                </div>
                <span className="tabular-nums text-gray-600">{formatAmount(item.actual, currency)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MonthlyForecastChart({
  year,
  items,
  currency,
}: {
  year: number;
  items: ForecastMonthRow[];
  currency: string;
}) {
  const max = useMemo(
    () => Math.max(...items.map((item) => Math.max(item.forecast, item.actual)), 1),
    [items],
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Forecast vs actual by month</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monthly breakdown for {year} — planned work (amber) vs invoices by issue date (green).
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.month} className="space-y-2 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                <span>Forecast</span>
                <span className="tabular-nums">{formatAmount(item.forecast, currency)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${(item.forecast / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                <span>Actual</span>
                <span className="tabular-nums">{formatAmount(item.actual, currency)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-green-600"
                  style={{ width: `${(item.actual / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatCard({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </Link>
  );
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

  const year = stats?.year ?? selectedYear;
  const displayCurrency = stats?.baseCurrency ?? baseCurrency;
  const isCurrentYear = year === currentYear;

  return (
    <ClientsOnlyGuard>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sales pipeline overview — actuals and forecast for {year}.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Year</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number.parseInt(e.target.value, 10))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                {yearOptions(currentYear).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Base currency</span>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                {BASE_CURRENCIES.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading && !stats ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actuals</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <StatCard label="Active opportunities" value={stats?.actuals.activeOpportunities ?? 0} href="/opportunities/active" />
                <StatCard label="Active contracts" value={stats?.actuals.activeContracts ?? 0} href="/contracts/active" />
                <StatCard
                  label={isCurrentYear ? "Expiring this month" : "Expiring this month (live)"}
                  value={stats?.actuals.contractsExpiringThisMonth ?? 0}
                  href="/contracts/active?expiring=thisMonth"
                />
                <StatCard
                  label={isCurrentYear ? "Expiring next month" : "Expiring next month (live)"}
                  value={stats?.actuals.contractsExpiringNextMonth ?? 0}
                  href="/contracts/active?expiring=nextMonth"
                />
                <StatCard label="Invoices awaiting payment" value={stats?.actuals.invoicesAwaitingPayment ?? 0} href="/invoices?status=AWAITING_PAYMENT" />
              </div>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <BarChart
                  title="Active contracts by client"
                  subtitle="Number of active contracts per client."
                  items={(stats?.actuals.activeContractsByClient ?? []).map((row) => ({
                    clientName: row.clientName,
                    count: row.count,
                    clientId: row.clientId,
                  }))}
                  labelKey="clientName"
                  valueKey="count"
                  getHref={(item) => `/contracts/active?clientId=${encodeURIComponent(String(item.clientId))}`}
                />
                <BarChart
                  title="Amount owed by client"
                  subtitle={`Total invoice amounts in ${displayCurrency} (draft and awaiting payment).`}
                  items={(stats?.actuals.amountOwedByClient ?? []).map((row) => ({
                    clientName: row.clientName,
                    amount: row.amount,
                    clientId: row.clientId,
                  }))}
                  labelKey="clientName"
                  valueKey="amount"
                  currency={displayCurrency}
                  getHref={() => "/invoices?status=AWAITING_PAYMENT"}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Forecast</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {stats?.forecastScope === "ytd"
                      ? `Forecasted revenue (YTD ${year})`
                      : `Forecasted revenue (${year})`}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatAmount(stats?.forecast.forecastedRevenueThisYear ?? 0, displayCurrency)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {stats?.forecastScope === "ytd"
                      ? `Planned work through this month, converted to ${displayCurrency}`
                      : `Converted to ${displayCurrency} at current exchange rates`}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {stats?.forecastScope === "ytd"
                      ? `Actual revenue (YTD ${year})`
                      : `Actual revenue (${year})`}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatAmount(stats?.forecast.actualRevenueThisYear ?? 0, displayCurrency)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Invoice amounts (excl. tax) in {displayCurrency} by issue date
                  </p>
                </div>
              </div>
              <MonthlyForecastChart
                year={year}
                items={stats?.forecast.forecastByMonth ?? []}
                currency={displayCurrency}
              />
              <DualBarChart
                title={
                  stats?.forecastScope === "ytd"
                    ? `Forecast vs actual (YTD ${year})`
                    : `Forecast vs actual (${year})`
                }
                subtitle={
                  stats?.forecastScope === "ytd"
                    ? `Grouped by client in ${displayCurrency} — planned work through this month (amber) vs invoices by issue date (green).`
                    : `Grouped by client in ${displayCurrency} — forecast (amber) vs actual by issue date (green).`
                }
                items={stats?.forecast.forecastVsActualByClient ?? []}
                currency={displayCurrency}
              />
            </section>
          </>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
