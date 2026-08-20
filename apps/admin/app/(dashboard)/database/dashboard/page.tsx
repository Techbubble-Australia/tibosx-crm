"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

type DashboardStats = {
  totalProfiles: number;
  applications30d: number;
  openRoles: number;
  countries: string[];
  clients: Array<{ id: string; name: string }>;
  profilesByTechnology: Array<{ technology: string; count: number }>;
  applicationsByActiveJob: Array<{
    jobId: string;
    jobTitle: string;
    clientId: string;
    clientName: string;
    count: number;
  }>;
};

function BarChart({
  title,
  subtitle,
  items,
  labelKey,
  countKey,
  filterLabel,
  filterValue,
  filterOptions,
  onFilterChange,
}: {
  title: string;
  subtitle: string;
  items: Array<Record<string, string | number>>;
  labelKey: string;
  countKey: string;
  filterLabel: string;
  filterValue: string;
  filterOptions: Array<{ value: string; label: string }>;
  onFilterChange: (value: string) => void;
}) {
  const maxCount = useMemo(() => {
    if (!items.length) return 1;
    return Math.max(...items.map((item) => Number(item[countKey])), 1);
  }, [items, countKey]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="min-w-[200px]">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{filterLabel}</label>
          <select
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
          >
            {filterOptions.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!items.length ? (
        <p className="text-sm text-gray-400">No data for this filter.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={String(item[labelKey])} className="grid grid-cols-[minmax(0,1fr)_1fr_auto] items-center gap-3">
              <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                {String(item[labelKey])}
              </span>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-black dark:bg-white"
                  style={{ width: `${(Number(item[countKey]) / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">{Number(item[countKey])}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DatabaseDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [country, setCountry] = useState("");
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (country) params.set("country", country);
        if (clientId) params.set("clientId", clientId);
        const query = params.toString() ? `?${params.toString()}` : "";
        const res = await adminFetch(`/api/admin/dashboard/stats${query}`);
        const data = await res.json();
        setStats(data.data ?? null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    void loadStats();
  }, [country, clientId]);

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  const clientOptions = [
    { value: "", label: "All clients" },
    ...(stats?.clients ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];

  const countryOptions = [
    { value: "", label: "All countries" },
    ...(stats?.countries ?? []).map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Overview of profiles, applications, and hiring pipeline metrics.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Total profiles", value: stats?.totalProfiles ?? 0 },
          { label: "Applications (30d)", value: stats?.applications30d ?? 0 },
          { label: "Open roles", value: stats?.openRoles ?? 0 },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BarChart
          title="Profiles by technology"
          subtitle="Filter by country to compare technology distribution."
          items={stats?.profilesByTechnology ?? []}
          labelKey="technology"
          countKey="count"
          filterLabel="Country"
          filterValue={country}
          filterOptions={countryOptions}
          onFilterChange={setCountry}
        />
        <BarChart
          title="Applications by active jobs"
          subtitle="Application counts for published job listings."
          items={(stats?.applicationsByActiveJob ?? []).map((row) => ({
            jobTitle: row.clientName ? `${row.jobTitle} (${row.clientName})` : row.jobTitle,
            count: row.count,
          }))}
          labelKey="jobTitle"
          countKey="count"
          filterLabel="Client"
          filterValue={clientId}
          filterOptions={clientOptions}
          onFilterChange={setClientId}
        />
      </div>
    </div>
  );
}
