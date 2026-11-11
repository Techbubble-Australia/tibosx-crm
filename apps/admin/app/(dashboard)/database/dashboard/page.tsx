"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";

type DashboardStats = {
  totalProfiles: number;
  activeApplications: number;
  interviewScheduled: number;
  awaitingFeedback: number;
  activeRoles: number;
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
  profilesByRecruiter: {
    months: string[];
    rows: Array<{ recruiterId: string | null; recruiterName: string; counts: number[]; total: number }>;
  };
};

function monthShort(monthKey: string): string {
  return new Date(`${monthKey}-01T00:00:00.000Z`).toLocaleDateString("en-AU", { month: "short", timeZone: "UTC" });
}

function ProfilesByRecruiter({ data }: { data: DashboardStats["profilesByRecruiter"] }) {
  const monthTotals = data.months.map((_, i) => data.rows.reduce((sum, row) => sum + (row.counts[i] ?? 0), 0));
  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Profiles added per recruiter</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          New profiles in the last 3 months, by the recruiter who sourced them.
        </p>
      </div>
      {!data.rows.length ? (
        <p className="text-sm text-gray-400">No profiles added in the last 3 months.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                <th className="py-2 pr-3">Recruiter</th>
                {data.months.map((m) => (
                  <th key={m} className="py-2 pr-3 text-right">{monthShort(m)}</th>
                ))}
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.recruiterId ?? "unassigned"} className="border-b border-gray-50 dark:border-gray-800">
                  <td className={`py-2 pr-3 ${row.recruiterId ? "font-medium text-gray-800 dark:text-gray-200" : "italic text-gray-500"}`}>
                    {row.recruiterName}
                  </td>
                  {row.counts.map((count, i) => (
                    <td key={data.months[i]} className="py-2 pr-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                      {count || "—"}
                    </td>
                  ))}
                  <td className="py-2 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold text-gray-900 dark:text-gray-100">
                <td className="py-2 pr-3">Total</td>
                {monthTotals.map((total, i) => (
                  <td key={data.months[i]} className="py-2 pr-3 text-right tabular-nums">{total}</td>
                ))}
                <td className="py-2 text-right tabular-nums">{grandTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

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
  getCountHref,
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
  getCountHref?: (item: Record<string, string | number>) => string | undefined;
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
              <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
                {getCountHref?.(item) ? (
                  <Link href={getCountHref(item)!} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {Number(item[countKey])}
                  </Link>
                ) : (
                  Number(item[countKey])
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const STAT_CARDS = [
  { key: "activeRoles", label: "Active Roles", href: "/jobs/active" },
  { key: "activeApplications", label: "Active Applications", href: "/career-applications/active" },
  {
    key: "interviewScheduled",
    label: "Interview Scheduled",
    href: "/career-applications/active?status=INTERVIEW_SCHEDULED",
  },
  {
    key: "awaitingFeedback",
    label: "Awaiting feedback",
    href: "/career-applications/active?status=AWAITING_FEEDBACK",
  },
  { key: "totalProfiles", label: "Total profiles", href: "/database/profiles" },
] as const;

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
        if (!res.ok) {
          console.error("Dashboard stats failed:", res.status, await res.text());
          return;
        }
        const data = await res.json();
        const raw = data.data;
        if (!raw) {
          setStats(null);
          return;
        }
        setStats({
          totalProfiles: raw.totalProfiles ?? 0,
          activeRoles: raw.activeRoles ?? raw.openRoles ?? 0,
          activeApplications: raw.activeApplications ?? raw.applications30d ?? 0,
          interviewScheduled: raw.interviewScheduled ?? 0,
          awaitingFeedback: raw.awaitingFeedback ?? 0,
          countries: raw.countries ?? [],
          clients: raw.clients ?? [],
          profilesByTechnology: raw.profilesByTechnology ?? [],
          applicationsByActiveJob: raw.applicationsByActiveJob ?? [],
          profilesByRecruiter: raw.profilesByRecruiter ?? { months: [], rows: [] },
        });
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats?.[card.key] ?? 0}
            </p>
          </Link>
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
          getCountHref={(item) => {
            const params = new URLSearchParams();
            params.set("technology", String(item.technology));
            if (country) params.set("country", country);
            return `/database/profiles?${params.toString()}`;
          }}
        />
        <div className="space-y-6">
        <ProfilesByRecruiter data={stats?.profilesByRecruiter ?? { months: [], rows: [] }} />
        <BarChart
          title="Applications by active jobs"
          subtitle="Application counts for published job listings."
          items={(stats?.applicationsByActiveJob ?? []).map((row) => ({
            jobId: row.jobId,
            jobTitle: row.clientName ? `${row.jobTitle} (${row.clientName})` : row.jobTitle,
            count: row.count,
          }))}
          labelKey="jobTitle"
          countKey="count"
          filterLabel="Client"
          filterValue={clientId}
          filterOptions={clientOptions}
          onFilterChange={setClientId}
          getCountHref={(item) => {
            const params = new URLSearchParams();
            params.set("jobListingId", String(item.jobId));
            return `/career-applications/active?${params.toString()}`;
          }}
        />
        </div>
      </div>
    </div>
  );
}
