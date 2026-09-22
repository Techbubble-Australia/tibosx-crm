"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type ClientCount = { clientId: string; clientName: string; count: number };
type ClientAmount = { clientId: string; clientName: string; amount: number };
type ForecastVsActual = { clientId: string; clientName: string; forecast: number; actual: number };

type SalesDashboardStats = {
  year: number;
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
  };
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function BarChart({
  title,
  subtitle,
  items,
  labelKey,
  valueKey,
  getHref,
}: {
  title: string;
  subtitle: string;
  items: Array<Record<string, string | number>>;
  labelKey: string;
  valueKey: string;
  getHref?: (item: Record<string, string | number>) => string | undefined;
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
                    {formatAmount(Number(item[valueKey]))}
                  </Link>
                ) : (
                  formatAmount(Number(item[valueKey]))
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DualBarChart({ title, subtitle, items }: { title: string; subtitle: string; items: ForecastVsActual[] }) {
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
                <span className="tabular-nums text-gray-600">{formatAmount(item.forecast)}</span>
              </div>
              <div className="grid grid-cols-[4rem_1fr_auto] items-center gap-2 text-xs">
                <span className="text-gray-500">Actual</span>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-green-600" style={{ width: `${(item.actual / max) * 100}%` }} />
                </div>
                <span className="tabular-nums text-gray-600">{formatAmount(item.actual)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [stats, setStats] = useState<SalesDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminFetch("/api/admin/sales-dashboard/stats")
      .then((res) => res.json())
      .then((data) => setStats(data.data as SalesDashboardStats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading && !stats) {
    return (
      <ClientsOnlyGuard>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      </ClientsOnlyGuard>
    );
  }

  const year = stats?.year ?? new Date().getFullYear();

  return (
    <ClientsOnlyGuard>
      <div className="space-y-8">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sales pipeline overview — actuals and forecast for {year}.
        </p>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actuals</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Active opportunities" value={stats?.actuals.activeOpportunities ?? 0} href="/opportunities/active" />
            <StatCard label="Active contracts" value={stats?.actuals.activeContracts ?? 0} href="/contracts/active" />
            <StatCard label="Expiring this month" value={stats?.actuals.contractsExpiringThisMonth ?? 0} href="/contracts/active?expiring=thisMonth" />
            <StatCard label="Expiring next month" value={stats?.actuals.contractsExpiringNextMonth ?? 0} href="/contracts/active?expiring=nextMonth" />
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
              subtitle="Total invoice amounts (draft and awaiting payment)."
              items={(stats?.actuals.amountOwedByClient ?? []).map((row) => ({
                clientName: row.clientName,
                amount: row.amount,
                clientId: row.clientId,
              }))}
              labelKey="clientName"
              valueKey="amount"
              getHref={() => "/invoices?status=AWAITING_PAYMENT"}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Forecast</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Forecasted revenue this year
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatAmount(stats?.forecast.forecastedRevenueThisYear ?? 0)}
              </p>
              <p className="mt-1 text-xs text-gray-500">T&M working days + milestone amounts</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Actual revenue this year
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatAmount(stats?.forecast.actualRevenueThisYear ?? 0)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Invoice amounts (excl. tax) by due date</p>
            </div>
          </div>
          <DualBarChart
            title="Forecast vs actual this year"
            subtitle="Grouped by client — forecast (amber) vs actual (green)."
            items={stats?.forecast.forecastVsActualByClient ?? []}
          />
        </section>
      </div>
    </ClientsOnlyGuard>
  );
}
