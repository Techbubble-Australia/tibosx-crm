"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { TimesheetStatusBadge } from "@/lib/timesheet-status-styles";
import { PROJECT_STATUS_LABELS, PROJECT_COST_TYPE_LABELS, formatProjectMonth, type ProjectStatus, type ProjectCostType } from "@/lib/project-types";

const BASE_CURRENCIES = ["AUD", "USD", "INR"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

type AttentionKind = "MISSING" | "AWAITING_APPROVAL" | "DRAFT_NOT_SUBMITTED" | "PAST_END_DATE";
type WeekRowStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "NOT_YET_SUBMITTED" | "MISSING";

type DashboardData = {
  today: string;
  baseCurrency: string;
  scope: "all" | "mine";
  kpis: {
    awaitingApproval: { count: number; hours: number };
    overdueDrafts: { count: number; hours: number };
    missingTimesheets: { count: number };
    activeProjects: { count: number; pastEndDate: number };
    estimatedCost: { total: number; beforeThisMonth: number };
    actualCost: { total: number; months: number };
  };
  attention: Array<{
    kind: AttentionKind;
    projectId: string;
    projectLabel: string;
    timesheetId: string | null;
    consultant: string | null;
    weekStart: string | null;
    weekEnd: string | null;
    hours: number | null;
    approver: string | null;
    endDate: string | null;
  }>;
  timesheetsByWeek: Array<{
    weekStart: string;
    weekEnd: string;
    projectId: string;
    projectLabel: string;
    consultant: string;
    status: WeekRowStatus;
    hours: number | null;
    timesheetId: string | null;
  }>;
  costByMonth: Array<{
    year: number;
    month: number;
    days: number;
    estimated: number;
    actual: number;
    costTypes: string[];
  }>;
  projects: Array<{
    id: string;
    projectNumber: string;
    title: string;
    clientName: string;
    consultants: string[];
    status: string;
    startDate: string;
    endDate: string;
    progress: number;
    remainingDays: number;
    ended: boolean;
  }>;
};

function formatMoney(value: number, currency: string, compact = false) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: compact && value >= 1000 ? 1 : 0,
    notation: compact && value >= 1000 ? "compact" : "standard",
  }).format(value);
}

function formatHours(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} h`;
}

function formatDay(iso: string, withYear = false) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

function formatWeek(start: string, end: string) {
  return `${formatDay(start)} – ${formatDay(end)}`;
}

function formatRange(start: string, end: string) {
  const sameYear = new Date(start).getUTCFullYear() === new Date(end).getUTCFullYear();
  return `${formatDay(start, !sameYear)} – ${formatDay(end, true)}`;
}

function Section({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle ? <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "warn" | "alert";
  href?: string;
}) {
  const valueTone =
    tone === "alert"
      ? "text-red-600 dark:text-red-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-gray-900 dark:text-gray-100";
  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${valueTone}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
    </>
  );
  const className =
    "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900";
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

const ATTENTION_META: Record<AttentionKind, { label: string; className: string }> = {
  MISSING: { label: "No timesheet", className: "bg-red-100 text-red-800 ring-red-200" },
  AWAITING_APPROVAL: { label: "Awaiting approval", className: "bg-amber-100 text-amber-900 ring-amber-200" },
  DRAFT_NOT_SUBMITTED: { label: "Draft not submitted", className: "bg-gray-100 text-gray-800 ring-gray-200" },
  PAST_END_DATE: { label: "Past end date", className: "bg-orange-100 text-orange-900 ring-orange-200" },
};

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}>
      {children}
    </span>
  );
}

function attentionDetail(item: DashboardData["attention"][number]): string {
  const week = item.weekStart && item.weekEnd ? formatWeek(item.weekStart, item.weekEnd) : "";
  switch (item.kind) {
    case "MISSING":
      return `${item.consultant}: nothing found for ${week}`;
    case "AWAITING_APPROVAL":
      return `${item.consultant}, ${formatHours(item.hours ?? 0)} for ${week}.${item.approver ? ` Approver: ${item.approver}` : ""}`;
    case "DRAFT_NOT_SUBMITTED":
      return `${item.consultant}, ${formatHours(item.hours ?? 0)} for ${week} is still a draft`;
    case "PAST_END_DATE":
      return `Ended ${item.endDate ? formatDay(item.endDate) : ""} but still marked Active`;
  }
}

function WeekStatus({ status }: { status: WeekRowStatus }) {
  if (status === "MISSING") return <Pill className="bg-red-100 text-red-800 ring-red-200">Missing</Pill>;
  if (status === "NOT_YET_SUBMITTED") {
    return <Pill className="bg-white text-gray-600 ring-gray-200 dark:bg-gray-900 dark:text-gray-300">Not yet submitted</Pill>;
  }
  return <TimesheetStatusBadge status={status} />;
}

function ProjectTimeline({ projects, today }: { projects: DashboardData["projects"]; today: string }) {
  const range = useMemo(() => {
    if (!projects.length) return null;
    const starts = projects.map((p) => new Date(p.startDate).getTime());
    const ends = projects.map((p) => new Date(p.endDate).getTime());
    const min = new Date(Math.min(...starts));
    const max = new Date(Math.max(...ends));
    const from = Date.UTC(min.getUTCFullYear(), min.getUTCMonth(), 1);
    const to = Date.UTC(max.getUTCFullYear(), max.getUTCMonth() + 1, 1);
    const ticks: Array<{ at: number; label: string }> = [];
    const cursor = new Date(from);
    const totalMonths = Math.round((to - from) / (30.44 * DAY_MS));
    const step = totalMonths > 18 ? 3 : totalMonths > 8 ? 2 : 1;
    while (cursor.getTime() < to) {
      ticks.push({
        at: cursor.getTime(),
        label: cursor.toLocaleDateString("en-AU", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(" ", " '"),
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + step);
    }
    return { from, to, ticks };
  }, [projects]);

  if (!range) return <p className="text-sm text-gray-400">No dated projects.</p>;
  const span = range.to - range.from;
  const ratio = (time: number) => Math.min(1, Math.max(0, (time - range.from) / span));
  const pct = (time: number) => `${ratio(time) * 100}%`;
  /** Keep labels near the chart edges inside the chart instead of centring them off the edge. */
  const edgeAlign = (time: number) => {
    const r = ratio(time);
    if (r < 0.04) return "translate-x-0";
    if (r > 0.96) return "-translate-x-full";
    return "-translate-x-1/2";
  };
  const todayMs = new Date(today).getTime();
  const todayInRange = todayMs >= range.from && todayMs <= range.to;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[11rem_1fr] gap-3 border-b border-gray-100 pb-1 dark:border-gray-800">
          <div className="flex items-end text-xs font-semibold uppercase tracking-wide text-gray-500">Project</div>
          <div className="relative h-10 text-[11px] text-gray-500">
            {todayInRange ? (
              <span
                className={`absolute top-0 whitespace-nowrap rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm ${edgeAlign(todayMs)}`}
                style={{ left: pct(todayMs) }}
              >
                Today
              </span>
            ) : null}
            {range.ticks.map((tick) => (
              <span
                key={tick.at}
                className={`absolute bottom-0 whitespace-nowrap font-medium ${edgeAlign(tick.at)}`}
                style={{ left: pct(tick.at) }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>
        <div className="relative pt-1">
          <div className="pointer-events-none absolute inset-y-0 left-[11.75rem] right-0">
            {range.ticks.map((tick) => (
              <div
                key={tick.at}
                className="absolute inset-y-0 w-px bg-gray-100 dark:bg-gray-800"
                style={{ left: pct(tick.at) }}
              />
            ))}
          </div>
          {projects.map((project) => {
            const start = new Date(project.startDate).getTime();
            const end = new Date(project.endDate).getTime();
            const width = Math.max(((end - start) / span) * 100, 0.8);
            return (
              <div key={project.id} className="relative grid grid-cols-[11rem_1fr] items-center gap-3 py-1.5">
                <Link
                  href={`/projects/${project.id}`}
                  className="truncate text-xs font-medium text-gray-700 hover:underline dark:text-gray-300"
                  title={`${project.projectNumber} · ${project.title}`}
                >
                  {project.projectNumber} · {project.consultants[0] ?? project.title}
                </Link>
                <div className="relative h-4 rounded bg-gray-50/70 dark:bg-gray-800/40">
                  <div
                    className={`absolute top-0 h-4 rounded ${project.ended ? "bg-gray-300 dark:bg-gray-600" : "bg-black dark:bg-white"}`}
                    style={{ left: pct(start), width: `${width}%` }}
                    title={`${project.projectNumber}: ${formatRange(project.startDate, project.endDate)}`}
                  />
                </div>
              </div>
            );
          })}
          {todayInRange ? (
            <div className="pointer-events-none absolute inset-y-0 left-[11.75rem] right-0">
              <div className="absolute inset-y-0 w-px bg-red-500" style={{ left: pct(todayMs) }} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CostByMonth({ rows, currency }: { rows: DashboardData["costByMonth"]; currency: string }) {
  const max = Math.max(...rows.map((r) => Math.max(r.estimated, r.actual)), 1);
  const totals = rows.reduce(
    (acc, row) => ({ days: acc.days + row.days, estimated: acc.estimated + row.estimated, actual: acc.actual + row.actual }),
    { days: 0, estimated: 0, actual: 0 },
  );
  const dayRate = totals.days > 0 ? totals.estimated / totals.days : null;

  if (!rows.length) {
    return <p className="text-sm text-gray-400">No estimates or actuals yet. Use Run Estimates on a project to populate this.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex h-44 items-end gap-2 overflow-x-auto border-b border-gray-100 pb-1 dark:border-gray-800">
        {rows.map((row) => (
          <div key={`${row.year}-${row.month}`} className="flex min-w-[3rem] flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[11px] tabular-nums text-gray-600 dark:text-gray-400">
              {formatMoney(row.estimated, currency, true)}
            </span>
            <div className="flex h-32 w-full items-end justify-center gap-0.5">
              <div className="w-1/2 max-w-6 rounded-t bg-black dark:bg-white" style={{ height: `${(row.estimated / max) * 100}%` }} />
              {row.actual > 0 ? (
                <div className="w-1/2 max-w-6 rounded-t bg-green-600" style={{ height: `${(row.actual / max) * 100}%` }} />
              ) : null}
            </div>
            <span className="text-[11px] text-gray-500">
              {new Date(Date.UTC(row.year, row.month, 1)).toLocaleDateString("en-AU", { month: "short", timeZone: "UTC" })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-black dark:bg-white" /> Estimated</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-600" /> Actual</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
              <th className="py-2 pr-3">Month</th>
              <th className="py-2 pr-3 text-right">Days</th>
              <th className="py-2 pr-3 text-right">Estimated</th>
              <th className="py-2 pr-3 text-right">Actual</th>
              <th className="py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.year}-${row.month}`} className="border-b border-gray-50 dark:border-gray-800">
                <td className="py-2 pr-3">{formatProjectMonth(row.year, row.month)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{row.days || "—"}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(row.estimated, currency)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{row.actual > 0 ? formatMoney(row.actual, currency) : "None"}</td>
                <td className="py-2">
                  {row.costTypes.map((t) => PROJECT_COST_TYPE_LABELS[t as ProjectCostType] ?? t).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-gray-900 dark:text-gray-100">
              <td className="py-2 pr-3">Total</td>
              <td className="py-2 pr-3 text-right tabular-nums">{Math.round(totals.days * 100) / 100}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(totals.estimated, currency)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{totals.actual > 0 ? formatMoney(totals.actual, currency) : "None"}</td>
              <td className="py-2 font-normal text-gray-500">
                {dayRate != null ? `Avg day rate ${formatMoney(dayRate, currency)}` : ""}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function ProjectManagerDashboardPage() {
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [baseCurrency, setBaseCurrency] = useState("AUD");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ scope, baseCurrency });
    void adminFetch(`/api/admin/project-dashboard?${params}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load dashboard");
        setData(body.data as DashboardData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [scope, baseCurrency]);

  useEffect(() => {
    load();
  }, [load]);

  const currency = data?.baseCurrency ?? baseCurrency;
  const kpis = data?.kpis;
  const weekGroups = useMemo(() => {
    const groups = new Map<string, DashboardData["timesheetsByWeek"]>();
    for (const row of data?.timesheetsByWeek ?? []) {
      const list = groups.get(row.weekStart) ?? [];
      list.push(row);
      groups.set(row.weekStart, list);
    }
    return [...groups.entries()];
  }, [data]);

  const selectClass =
    "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";

  return (
    <ProjectManagementGuard requireManageProjects>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Project manager dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data ? `Snapshot as of ${formatDay(data.today, true)}` : "Loading snapshot…"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={scope} onChange={(e) => setScope(e.target.value as "all" | "mine")} className={selectClass}>
              <option value="all">All projects</option>
              <option value="mine">Managed by me</option>
            </select>
            <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} className={selectClass}>
              {BASE_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        {loading && !data ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : data && kpis ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard
                label="Awaiting approval"
                value={kpis.awaitingApproval.count}
                hint={`${formatHours(kpis.awaitingApproval.hours)} to approve`}
                tone={kpis.awaitingApproval.count ? "warn" : "default"}
                href="/timesheets"
              />
              <KpiCard
                label="Overdue drafts"
                value={kpis.overdueDrafts.count}
                hint={`${formatHours(kpis.overdueDrafts.hours)} not yet submitted`}
                tone={kpis.overdueDrafts.count ? "warn" : "default"}
                href="/timesheets"
              />
              <KpiCard
                label="Missing timesheets"
                value={kpis.missingTimesheets.count}
                hint="expected last week, none found"
                tone={kpis.missingTimesheets.count ? "alert" : "default"}
              />
              <KpiCard
                label="Active projects"
                value={kpis.activeProjects.count}
                hint={kpis.activeProjects.pastEndDate ? `${kpis.activeProjects.pastEndDate} past end date` : "all within dates"}
                tone={kpis.activeProjects.pastEndDate ? "warn" : "default"}
                href="/projects"
              />
              <KpiCard
                label="Estimated cost"
                value={formatMoney(kpis.estimatedCost.total, currency)}
                hint={`${formatMoney(kpis.estimatedCost.beforeThisMonth, currency)} before this month`}
              />
              <KpiCard
                label="Actual cost"
                value={formatMoney(kpis.actualCost.total, currency)}
                hint={kpis.actualCost.months ? `across ${kpis.actualCost.months} month(s)` : "none recorded yet"}
              />
            </div>

            <Section title="Needs attention" subtitle="Missing, unapproved and overdue items, most urgent first">
              {data.attention.length === 0 ? (
                <p className="text-sm text-gray-400">Nothing needs attention right now.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                        <th className="py-2 pr-3">Issue</th>
                        <th className="py-2 pr-3">Project</th>
                        <th className="py-2">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.attention.map((item, index) => {
                        const meta = ATTENTION_META[item.kind];
                        const href = item.timesheetId ? `/timesheets/${item.timesheetId}` : `/projects/${item.projectId}`;
                        return (
                          <tr key={`${item.kind}-${item.projectId}-${item.timesheetId ?? index}`} className="border-b border-gray-50 dark:border-gray-800">
                            <td className="py-2 pr-3"><Pill className={meta.className}>{meta.label}</Pill></td>
                            <td className="py-2 pr-3">
                              <Link href={`/projects/${item.projectId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                {item.projectLabel}
                              </Link>
                            </td>
                            <td className="py-2 text-gray-700 dark:text-gray-300">
                              <Link href={href} className="hover:underline">{attentionDetail(item)}</Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section
              title="Timesheets by week"
              subtitle="Every project member expected to log time that week. “Not yet submitted” means the week is still running and no timesheet exists yet."
            >
              {weekGroups.length === 0 ? (
                <p className="text-sm text-gray-400">No active projects with members in these weeks.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                        <th className="py-2 pr-3">Week</th>
                        <th className="py-2 pr-3">Project</th>
                        <th className="py-2 pr-3">Consultant</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekGroups.flatMap(([, rows]) =>
                        rows.map((row) => (
                          <tr key={`${row.weekStart}-${row.projectId}-${row.consultant}`} className="border-b border-gray-50 dark:border-gray-800">
                            <td className="whitespace-nowrap py-2 pr-3 text-gray-600 dark:text-gray-400">{formatWeek(row.weekStart, row.weekEnd)}</td>
                            <td className="py-2 pr-3">
                              <Link href={`/projects/${row.projectId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                {row.projectLabel}
                              </Link>
                            </td>
                            <td className="py-2 pr-3">{row.consultant}</td>
                            <td className="py-2 pr-3">
                              {row.timesheetId ? (
                                <Link href={`/timesheets/${row.timesheetId}`}><WeekStatus status={row.status} /></Link>
                              ) : (
                                <WeekStatus status={row.status} />
                              )}
                            </td>
                            <td className="py-2 text-right tabular-nums">{row.hours != null ? row.hours : "—"}</td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Project timeline" subtitle="Start to end of each project, with today marked. Grey bars have ended.">
              <ProjectTimeline projects={data.projects} today={data.today} />
            </Section>

            <Section title="Estimated cost by month" subtitle={`Project estimates and actuals combined, in ${currency}.`}>
              <CostByMonth rows={data.costByMonth} currency={currency} />
            </Section>

            <Section title="All projects" subtitle="Time elapsed to today for each project">
              {data.projects.length === 0 ? (
                <p className="text-sm text-gray-400">No projects.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                        <th className="py-2 pr-3">Project</th>
                        <th className="py-2 pr-3">Client</th>
                        <th className="py-2 pr-3">Consultant</th>
                        <th className="py-2 pr-3">Dates</th>
                        <th className="py-2 pr-3">Progress</th>
                        <th className="py-2 pr-3">Remaining</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.projects.map((project) => (
                        <tr key={project.id} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="py-2 pr-3">
                            <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                              {project.projectNumber} · {project.title}
                            </Link>
                          </td>
                          <td className="py-2 pr-3">{project.clientName}</td>
                          <td className="py-2 pr-3">{project.consultants.join(", ") || "—"}</td>
                          <td className="whitespace-nowrap py-2 pr-3">{formatRange(project.startDate, project.endDate)}</td>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                  className={`h-full rounded-full ${project.ended ? "bg-gray-400" : "bg-black dark:bg-white"}`}
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                              <span className="tabular-nums text-gray-600 dark:text-gray-400">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap py-2 pr-3 tabular-nums">
                            {project.ended ? "Ended" : `${project.remainingDays} days`}
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              <Pill className="bg-gray-100 text-gray-800 ring-gray-200">
                                {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
                              </Pill>
                              {project.ended && project.status === "ACTIVE" ? (
                                <Pill className="bg-orange-100 text-orange-900 ring-orange-200">Ended</Pill>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </>
        ) : null}
      </div>
    </ProjectManagementGuard>
  );
}
