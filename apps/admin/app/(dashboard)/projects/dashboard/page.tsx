"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { RefreshCw, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { useDismissedToday } from "@/hooks/useDismissedToday";
import { TimesheetStatusBadge } from "@/lib/timesheet-status-styles";
import { PROJECT_STATUS_LABELS, formatProjectMonth, type ProjectStatus } from "@/lib/project-types";

/** Costs are stored in AUD; the currency filter converts for display. */
const CURRENCIES = ["AUD", "USD", "GBP", "EUR", "INR", "PHP"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type AttentionKind = "MISSING" | "AWAITING_APPROVAL" | "DRAFT_NOT_SUBMITTED" | "PAST_END_DATE";
type WeekRowStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "NOT_YET_SUBMITTED" | "MISSING";

type MonthTimesheetRow = {
  weekStart: string;
  weekEnd: string;
  projectId: string;
  projectLabel: string;
  consultant: string;
  status: WeekRowStatus;
  hours: number | null;
  timesheetId: string | null;
};

type MemberRateRow = {
  name: string;
  rateCurrency: string;
  rate: number;
  rateFrequency: string;
  rateFrequencyLabel: string;
  unitsPerAud: number;
  rateInAud: number;
};

function currentMonthInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthInput(value: string): string {
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });
}

type DashboardData = {
  today: string;
  currency?: string;
  baseCurrency: string;
  costCurrency?: string;
  exchangeRates?: Array<{ currency: string; unitsPerAud: number; label: string }>;
  scope: "all" | "mine";
  kpis: {
    awaitingApproval: { count: number; hours: number };
    overdueDrafts: { count: number; hours: number };
    missingTimesheets: { count: number };
    activeProjects: { count: number; pastEndDate: number };
    estimatedCost: { total: number; beforeThisMonth: number; totalAud?: number; beforeThisMonthAud?: number };
    actualCost: { total: number; months: number; totalAud?: number };
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
    estimatedCost?: number;
    estimatedCostAud?: number;
    actualCost?: number;
    actualCostAud?: number;
    memberRates?: MemberRateRow[];
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

function formatRateMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
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

/** Timesheet periods are calendar months. */
function formatPeriod(start: string) {
  return new Date(start).toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });
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
  const week = item.weekStart ? formatPeriod(item.weekStart) : "";
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

function attentionKey(item: DashboardData["attention"][number]): string {
  return [item.kind, item.projectId, item.timesheetId ?? "", item.consultant ?? "", item.weekStart ?? ""].join("|");
}

/** OPEN is used internally by the timeline; it isn't offered in the All projects filter. */
type ProjectStatusFilter = "ALL" | "OPEN" | "ACTIVE_ALL" | ProjectStatus;

const PROJECT_STATUS_FILTERS: Array<{ value: ProjectStatusFilter; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: PROJECT_STATUS_LABELS.DRAFT },
  { value: "ACTIVE", label: PROJECT_STATUS_LABELS.ACTIVE },
  { value: "ACTIVE_ALL", label: "Active (incl. past end date)" },
  { value: "ON_HOLD", label: PROJECT_STATUS_LABELS.ON_HOLD },
  { value: "COMPLETED", label: PROJECT_STATUS_LABELS.COMPLETED },
  { value: "CANCELLED", label: PROJECT_STATUS_LABELS.CANCELLED },
];

function matchesStatusFilter(project: DashboardData["projects"][number], filter: ProjectStatusFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "OPEN") return ["ACTIVE", "ON_HOLD", "DRAFT"].includes(project.status);
  if (filter === "ACTIVE_ALL") return project.status === "ACTIVE";
  if (filter === "ACTIVE") return project.status === "ACTIVE" && !project.ended;
  return project.status === filter;
}

function uniqueProjectOptions(rows: Array<{ projectId: string; projectLabel: string }>) {
  const map = new Map<string, string>();
  for (const row of rows) map.set(row.projectId, row.projectLabel);
  return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
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
    const months: Array<{ at: number; end: number; label: string; year: number; showYear: boolean }> = [];
    const cursor = new Date(from);
    while (cursor.getTime() < to) {
      const at = cursor.getTime();
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      months.push({
        at,
        end: Date.UTC(year, month + 1, 1),
        label: MONTH_SHORT[month]!,
        year,
        showYear: months.length === 0 || month === 0,
      });
      cursor.setUTCMonth(month + 1);
    }
    return { from, to, months };
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
  const minChartWidth = `calc(16.75rem + ${range.months.length * 2.75}rem)`;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: `max(720px, ${minChartWidth})` }}>
        <div className="grid grid-cols-[16rem_1fr] gap-3 border-b border-gray-100 pb-1 dark:border-gray-800">
          <div className="flex items-end text-xs font-semibold uppercase tracking-wide text-gray-500">Project</div>
          <div className="relative h-14 text-[11px] text-gray-500">
            {todayInRange ? (
              <span
                className={`absolute top-0 whitespace-nowrap rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm ${edgeAlign(todayMs)}`}
                style={{ left: pct(todayMs) }}
              >
                Today
              </span>
            ) : null}
            {range.months
              .filter((m) => m.showYear)
              .map((m) => (
                <span
                  key={`year-${m.at}`}
                  className="absolute bottom-5 whitespace-nowrap pl-1 font-semibold text-gray-700 dark:text-gray-300"
                  style={{ left: pct(m.at) }}
                >
                  {m.year}
                </span>
              ))}
            {range.months.map((m) => (
              <span
                key={m.at}
                className="absolute bottom-0 text-center font-medium"
                style={{ left: pct(m.at), width: `${(ratio(m.end) - ratio(m.at)) * 100}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
        <div className="relative pt-1">
          <div className="pointer-events-none absolute inset-y-0 left-[16.75rem] right-0">
            {range.months.map((m) => (
              <div
                key={m.at}
                className={`absolute inset-y-0 w-px ${m.showYear ? "bg-gray-300 dark:bg-gray-600" : "bg-gray-100 dark:bg-gray-800"}`}
                style={{ left: pct(m.at) }}
              />
            ))}
          </div>
          {projects.map((project) => {
            const start = new Date(project.startDate).getTime();
            const end = new Date(project.endDate).getTime();
            const width = Math.max(((end - start) / span) * 100, 0.8);
            return (
              <div key={project.id} className="relative grid grid-cols-[16rem_1fr] items-center gap-3 py-1.5">
                <Link
                  href={`/projects/${project.id}`}
                  className="truncate text-xs font-medium text-gray-700 hover:underline dark:text-gray-300"
                  title={`${project.projectNumber} · ${project.title}`}
                >
                  {project.projectNumber} · {project.title}
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
            <div className="pointer-events-none absolute inset-y-0 left-[16.75rem] right-0">
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
    (acc, row) => ({ estimated: acc.estimated + row.estimated, actual: acc.actual + row.actual }),
    { estimated: 0, actual: 0 },
  );

  if (!rows.length) {
    return <p className="text-sm text-gray-400">No estimates or actuals for this year. Use Run Estimates on a project to populate this.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex h-44 items-end gap-2 overflow-x-auto border-b border-gray-100 pb-1 dark:border-gray-800">
        {rows.map((row) => (
          <div
            key={`${row.year}-${row.month}`}
            className="group relative flex min-w-[3rem] flex-1 flex-col items-center justify-end gap-1"
            title={`${formatProjectMonth(row.year, row.month)} · Estimated ${formatMoney(row.estimated, currency)} · Actual ${formatMoney(row.actual, currency)}`}
          >
            <div className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg group-hover:block dark:bg-gray-100 dark:text-gray-900">
              <p className="font-semibold">{formatProjectMonth(row.year, row.month)}</p>
              <p>Estimated: {formatMoney(row.estimated, currency)}</p>
              <p>Actual: {formatMoney(row.actual, currency)}</p>
            </div>
            <span className="text-[11px] tabular-nums text-gray-600 dark:text-gray-400">
              {formatMoney(row.estimated, currency, true)}
            </span>
            <div className="flex h-32 w-full items-end justify-center gap-0.5">
              <div className="w-1/2 max-w-6 rounded-t bg-black dark:bg-white" style={{ height: `${(row.estimated / max) * 100}%` }} />
              {row.actual > 0 ? (
                <div className="w-1/2 max-w-6 rounded-t bg-green-600" style={{ height: `${(row.actual / max) * 100}%` }} />
              ) : null}
            </div>
            <span className="text-[11px] text-gray-500">{MONTH_SHORT[row.month]}</span>
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
              <th className="py-2 pr-3 text-right">Estimated</th>
              <th className="py-2 text-right">Actual</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.year}-${row.month}`} className="border-b border-gray-50 dark:border-gray-800">
                <td className="py-2 pr-3">{formatProjectMonth(row.year, row.month)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(row.estimated, currency)}</td>
                <td className="py-2 text-right tabular-nums">{row.actual > 0 ? formatMoney(row.actual, currency) : "None"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-gray-900 dark:text-gray-100">
              <td className="py-2 pr-3">Total</td>
              <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(totals.estimated, currency)}</td>
              <td className="py-2 text-right tabular-nums">{totals.actual > 0 ? formatMoney(totals.actual, currency) : "None"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function ProjectManagerDashboardPage() {
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [baseCurrency, setBaseCurrency] = useState<string>("AUD");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ scope, currency: baseCurrency });
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

  const currency = data?.currency ?? data?.baseCurrency ?? baseCurrency;
  const kpis = data?.kpis;
  const { userId } = useAdminSession();
  const { dismissed, dismiss, restoreAll } = useDismissedToday("pm-dashboard-attention", userId);
  const [attentionProject, setAttentionProject] = useState("");
  const [weekProject, setWeekProject] = useState("");
  const [timesheetMonth, setTimesheetMonth] = useState(currentMonthInput);
  const [monthRows, setMonthRows] = useState<MonthTimesheetRow[]>([]);
  const [monthLoading, setMonthLoading] = useState(true);
  const [projectStatusFilter, setProjectStatusFilter] = useState<ProjectStatusFilter>("ACTIVE_ALL");
  const [costYear, setCostYear] = useState<number | null>(null);

  useEffect(() => {
    if (!timesheetMonth) return;
    let cancelled = false;
    setMonthLoading(true);
    const params = new URLSearchParams({ scope, month: timesheetMonth });
    void adminFetch(`/api/admin/project-dashboard/timesheets-by-month?${params}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load timesheets");
        if (!cancelled) setMonthRows((body.data?.rows ?? []) as MonthTimesheetRow[]);
      })
      .catch(() => {
        if (!cancelled) setMonthRows([]);
      })
      .finally(() => {
        if (!cancelled) setMonthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, timesheetMonth, refreshKey]);

  const attentionAll = useMemo(
    () => (data?.attention ?? []).filter((item) => !dismissed.has(attentionKey(item))),
    [data, dismissed],
  );
  const hiddenAttention = (data?.attention.length ?? 0) - attentionAll.length;
  const attentionRows = useMemo(
    () => attentionAll.filter((item) => !attentionProject || item.projectId === attentionProject),
    [attentionAll, attentionProject],
  );
  const weekRows = useMemo(
    () => monthRows.filter((row) => !weekProject || row.projectId === weekProject),
    [monthRows, weekProject],
  );
  const filteredProjects = useMemo(
    () => (data?.projects ?? []).filter((project) => matchesStatusFilter(project, projectStatusFilter)),
    [data, projectStatusFilter],
  );
  const memberRateRows = useMemo(
    () =>
      filteredProjects.flatMap((project) =>
        (project.memberRates ?? []).map((rate) => ({
          key: `${project.id}-${rate.name}-${rate.rateCurrency}-${rate.rateFrequency}`,
          projectId: project.id,
          projectNumber: project.projectNumber,
          name: rate.name,
          rate: rate.rate,
          rateCurrency: rate.rateCurrency,
          rateFrequencyLabel: rate.rateFrequencyLabel,
          unitsPerAud: rate.unitsPerAud,
          rateInAud: rate.rateInAud,
        })),
      ),
    [filteredProjects],
  );
  const timelineProjects = useMemo(
    () => (data?.projects ?? []).filter((project) => matchesStatusFilter(project, "OPEN")),
    [data],
  );
  const costYears = useMemo(() => {
    const years = new Set((data?.costByMonth ?? []).map((row) => row.year));
    if (data) years.add(new Date(data.today).getUTCFullYear());
    return [...years].sort((a, b) => b - a);
  }, [data]);
  const selectedCostYear = costYear ?? (data ? new Date(data.today).getUTCFullYear() : null);
  const costRows = useMemo(
    () => (data?.costByMonth ?? []).filter((row) => row.year === selectedCostYear),
    [data, selectedCostYear],
  );

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
            <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              Display currency
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className={selectClass}
                aria-label="Convert costs into this currency for display"
              >
                {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                load();
                setRefreshKey((key) => key + 1);
              }}
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
            {(data.exchangeRates?.length ?? 0) > 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-gray-100">Current conversion rates</span>
                <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                Costs are calculated in {data.costCurrency ?? "AUD"}.{" "}
                {data.exchangeRates!.map((rate) => rate.label).join(" · ")}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard
                label="Awaiting approval"
                value={kpis.awaitingApproval.count}
                hint={`${formatHours(kpis.awaitingApproval.hours)} to approve`}
                tone={kpis.awaitingApproval.count ? "warn" : "default"}
                href="/timesheets?status=SUBMITTED"
              />
              <KpiCard
                label="Overdue drafts"
                value={kpis.overdueDrafts.count}
                hint={`${formatHours(kpis.overdueDrafts.hours)} from past months not yet submitted`}
                tone={kpis.overdueDrafts.count ? "warn" : "default"}
                href="/timesheets?status=OVERDUE_DRAFT"
              />
              <KpiCard
                label="Missing timesheets"
                value={kpis.missingTimesheets.count}
                hint="expected last month, none found"
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
                hint={[
                  `${formatMoney(kpis.estimatedCost.beforeThisMonth, currency)} before this month`,
                  currency !== "AUD" && kpis.estimatedCost.totalAud != null
                    ? `= ${formatMoney(kpis.estimatedCost.totalAud, "AUD")}`
                    : null,
                ].filter(Boolean).join(" · ")}
              />
              <KpiCard
                label="Actual cost"
                value={formatMoney(kpis.actualCost.total, currency)}
                hint={[
                  kpis.actualCost.months ? `across ${kpis.actualCost.months} month(s)` : "none recorded yet",
                  currency !== "AUD" && kpis.actualCost.totalAud != null
                    ? `= ${formatMoney(kpis.actualCost.totalAud, "AUD")}`
                    : null,
                ].filter(Boolean).join(" · ")}
              />
            </div>

            <Section
              title="Needs attention"
              subtitle="Missing, unapproved and overdue items, most urgent first"
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  {hiddenAttention > 0 ? (
                    <button type="button" onClick={restoreAll} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                      Show {hiddenAttention} dismissed
                    </button>
                  ) : null}
                  <select
                    value={attentionProject}
                    onChange={(e) => setAttentionProject(e.target.value)}
                    className={selectClass}
                    aria-label="Filter needs attention by project"
                  >
                    <option value="">All projects</option>
                    {uniqueProjectOptions(attentionAll).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                </div>
              }
            >
              {attentionRows.length === 0 ? (
                <p className="text-sm text-gray-400">
                  {attentionProject ? "Nothing needs attention for this project." : "Nothing needs attention right now."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                        <th className="py-2 pr-3">Issue</th>
                        <th className="py-2 pr-3">Project</th>
                        <th className="py-2 pr-3">Detail</th>
                        <th className="w-10 py-2" aria-label="Dismiss" />
                      </tr>
                    </thead>
                    <tbody>
                      {attentionRows.map((item) => {
                        const meta = ATTENTION_META[item.kind];
                        const href = item.timesheetId ? `/timesheets/${item.timesheetId}` : `/projects/${item.projectId}`;
                        const key = attentionKey(item);
                        return (
                          <tr key={key} className="border-b border-gray-50 dark:border-gray-800">
                            <td className="py-2 pr-3"><Pill className={meta.className}>{meta.label}</Pill></td>
                            <td className="py-2 pr-3">
                              <Link href={`/projects/${item.projectId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                                {item.projectLabel}
                              </Link>
                            </td>
                            <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                              <Link href={href} className="hover:underline">{attentionDetail(item)}</Link>
                            </td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() => dismiss(key)}
                                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                aria-label={`Dismiss for today: ${meta.label} on ${item.projectLabel}`}
                                title="Dismiss for today"
                              >
                                <X className="h-4 w-4" />
                              </button>
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
              title="Timesheets by month"
              subtitle={`Monthly timesheets for ${formatMonthInput(timesheetMonth)}. Each project member is expected to submit one timesheet per month; “Not yet submitted” means the month hasn't ended yet.`}
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="month"
                    value={timesheetMonth}
                    onChange={(e) => setTimesheetMonth(e.target.value || currentMonthInput())}
                    className={selectClass}
                    aria-label="Timesheet month"
                  />
                  <select
                    value={weekProject}
                    onChange={(e) => setWeekProject(e.target.value)}
                    className={selectClass}
                    aria-label="Filter timesheets by project"
                  >
                    <option value="">All projects</option>
                    {uniqueProjectOptions(monthRows).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                </div>
              }
            >
              {monthLoading && monthRows.length === 0 ? (
                <p className="text-sm text-gray-400">Loading timesheets…</p>
              ) : weekRows.length === 0 ? (
                <p className="text-sm text-gray-400">
                  {weekProject ? "No timesheets expected for this project in this month." : "No active projects with members in this month."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                        <th className="py-2 pr-3">Month</th>
                        <th className="py-2 pr-3">Project</th>
                        <th className="py-2 pr-3">Consultant</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekRows.map((row) => (
                          <tr key={`${row.weekStart}-${row.projectId}-${row.consultant}`} className="border-b border-gray-50 dark:border-gray-800">
                            <td className="whitespace-nowrap py-2 pr-3 text-gray-600 dark:text-gray-400">{formatPeriod(row.weekStart)}</td>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Project timeline" subtitle="Start to end of each project, with today marked. Grey bars have ended.">
              <ProjectTimeline projects={timelineProjects} today={data.today} />
            </Section>

            <Section
              title="Estimated vs Actual costs by month"
              subtitle={`Project estimates and actuals in ${currency}${currency !== "AUD" ? " (converted from AUD)" : ""}. Hover a month to see both figures.`}
              actions={
                <select
                  value={selectedCostYear ?? ""}
                  onChange={(e) => setCostYear(Number(e.target.value))}
                  className={selectClass}
                  aria-label="Filter costs by year"
                >
                  {costYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              }
            >
              <CostByMonth rows={costRows} currency={currency} />
            </Section>

            <Section
              title="All projects"
              subtitle="Time elapsed to today for each project"
              actions={
                <select
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value as ProjectStatusFilter)}
                  className={selectClass}
                  aria-label="Filter projects by status"
                >
                  {PROJECT_STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              }
            >
              {filteredProjects.length === 0 ? (
                <p className="text-sm text-gray-400">No projects match this status.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[56rem] table-fixed text-sm">
                    <colgroup>
                      <col className="w-[28%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[14%]" />
                      <col className="w-[7%]" />
                      <col className="w-[5%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                        <th className="py-2 pr-4">Project</th>
                        <th className="py-2 px-3 text-right">Estimate</th>
                        <th className="py-2 px-3 text-right">Actual</th>
                        <th className="border-l border-gray-100 py-2 pl-4 pr-3 dark:border-gray-800">Start</th>
                        <th className="py-2 pr-3">End</th>
                        <th className="py-2 pr-3">Progress</th>
                        <th className="py-2 pr-3">Left</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((project) => (
                        <tr key={project.id} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="truncate py-2 pr-4">
                            <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline dark:text-blue-400" title={`${project.projectNumber} · ${project.title}`}>
                              {project.projectNumber} · {project.title}
                            </Link>
                          </td>
                          <td
                            className="whitespace-nowrap py-2 px-3 text-right tabular-nums"
                            title={
                              currency !== "AUD" && project.estimatedCostAud
                                ? formatMoney(project.estimatedCostAud, "AUD")
                                : undefined
                            }
                          >
                            {project.estimatedCost ? formatMoney(project.estimatedCost, currency) : "—"}
                          </td>
                          <td
                            className="whitespace-nowrap py-2 px-3 text-right tabular-nums"
                            title={
                              currency !== "AUD" && project.actualCostAud
                                ? formatMoney(project.actualCostAud, "AUD")
                                : undefined
                            }
                          >
                            {project.actualCost ? formatMoney(project.actualCost, currency) : "—"}
                          </td>
                          <td className="whitespace-nowrap border-l border-gray-100 py-2 pl-4 pr-3 tabular-nums dark:border-gray-800">
                            {formatDay(project.startDate, true)}
                          </td>
                          <td className="whitespace-nowrap py-2 pr-3 tabular-nums">{formatDay(project.endDate, true)}</td>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                  className={`h-full rounded-full ${project.ended ? "bg-gray-400" : "bg-black dark:bg-white"}`}
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                              <span className="w-8 shrink-0 text-right tabular-nums text-gray-600 dark:text-gray-400">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap py-2 pr-3 tabular-nums">
                            {project.ended ? "Ended" : `${project.remainingDays}d`}
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

            <Section
              title="Member rates"
              subtitle="User currency, current conversion rate, and AUD equivalent"
            >
              {memberRateRows.length === 0 ? (
                <p className="text-sm text-gray-400">No member rates on these projects.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                        <th className="py-2 pr-3">Project</th>
                        <th className="py-2 pr-3">Member</th>
                        <th className="py-2 pr-3 text-right">Rate</th>
                        <th className="py-2 pr-3 text-right">Conversion</th>
                        <th className="py-2 text-right">AUD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberRateRows.map((row) => (
                        <tr key={row.key} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="py-2 pr-3">
                            <Link href={`/projects/${row.projectId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                              {row.projectNumber}
                            </Link>
                          </td>
                          <td className="py-2 pr-3">{row.name}</td>
                          <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums">
                            {formatRateMoney(row.rate, row.rateCurrency)}/{row.rateFrequencyLabel}
                          </td>
                          <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums text-gray-500 dark:text-gray-400">
                            {row.rateCurrency === "AUD" ? "—" : `1 AUD = ${row.unitsPerAud} ${row.rateCurrency}`}
                          </td>
                          <td className="whitespace-nowrap py-2 text-right tabular-nums">
                            {formatRateMoney(row.rateInAud, "AUD")}/{row.rateFrequencyLabel}
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
