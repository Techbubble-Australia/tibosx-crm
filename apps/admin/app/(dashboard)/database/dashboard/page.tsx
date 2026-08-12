"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

type DashboardStats = {
  totalProfiles: number;
  applications30d: number;
  openRoles: number;
  countries: string[];
  profilesByTechnology: Array<{ technology: string; count: number }>;
};

export default function DatabaseDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const query = country ? `?country=${encodeURIComponent(country)}` : "";
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
  }, [country]);

  const maxCount = useMemo(() => {
    if (!stats?.profilesByTechnology.length) return 1;
    return Math.max(...stats.profilesByTechnology.map((item) => item.count), 1);
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

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

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Profiles by technology</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Filter by country to compare technology distribution.
            </p>
          </div>
          <div className="min-w-[220px]">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="dashboard-country">
              Country
            </label>
            <select
              id="dashboard-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value="">All countries</option>
              {(stats?.countries ?? []).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        {!stats?.profilesByTechnology.length ? (
          <p className="text-sm text-gray-400">No profile data yet for this filter.</p>
        ) : (
          <div className="space-y-3">
            {stats.profilesByTechnology.map((item) => (
              <div key={item.technology} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3">
                <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{item.technology}</span>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-black dark:bg-white"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
