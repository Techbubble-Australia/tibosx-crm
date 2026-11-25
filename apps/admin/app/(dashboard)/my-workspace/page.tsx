"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileSignature,
  FileWarning,
  FolderKanban,
  Plus,
  RefreshCw,
  Undo2,
  UserRound,
  X,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { defaultLandingPath, isRestrictedToWorkspaceOnly } from "@/lib/admin-roles";
import { useDismissedToday } from "@/hooks/useDismissedToday";
import { TimesheetStatusBadge } from "@/lib/timesheet-status-styles";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/project-types";
import { MyDayPanel } from "@/components/sales/MyDayPanel";

type MonthStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "NOT_STARTED" | "MISSING";
type ActionKind = "AGREEMENT" | "PROFILE" | "RETURNED" | "OVERDUE_DRAFT" | "MISSING";

type MonthRow = {
  projectId: string;
  projectLabel: string;
  status: MonthStatus;
  hours: number;
  timesheetId: string | null;
  rejectReason: string | null;
};

type MemberDashboard = {
  today: string;
  userName: string;
  weekStart: string;
  weekEnd: string;
  monthStart: string;
  lastMonthStart: string;
  isProjectMember: boolean;
  onboarding: { agreementPending: boolean; profilePending: boolean };
  kpis: {
    hoursThisWeek: number;
    awaitingApproval: { count: number; hours: number };
    approvedHoursThisMonth: number;
    approvedHoursLastMonth: number;
    lastMonthLabel: string;
    activeProjects: number;
  };
  actionItems: Array<{ id: string; kind: ActionKind; title: string; detail: string; href: string }>;
  thisMonth: MonthRow[];
  lastMonth: MonthRow[];
  weeklyHours: Array<{ weekStart: string; approved: number; submitted: number; draft: number }>;
  projects: Array<{
    id: string;
    projectNumber: string;
    title: string;
    clientName: string;
    status: string;
    startDate: string;
    endDate: string;
    progress: number;
    remainingDays: number;
    ended: boolean;
    projectManager: string;
    hoursThisMonth: number;
    hoursLastMonth: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    reason: string | null;
    createdAt: string;
    performedBy: string;
    timesheetId: string;
    projectLabel: string;
    weekStart: string;
    weekEnd: string;
  }>;
};

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

function formatHours(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} h`;
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDay(iso, true);
}

function newTimesheetHref(projectId: string, monthStart: string) {
  return `/timesheets/new?projectId=${encodeURIComponent(projectId)}&month=${monthStart.slice(0, 7)}`;
}

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });
}

function Card({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
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

function Kpi({
  icon,
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "good" | "warn" | "alert";
  href?: string;
}) {
  const toneClass = {
    default: "text-gray-900 dark:text-gray-100",
    good: "text-green-700 dark:text-green-400",
    warn: "text-amber-600 dark:text-amber-400",
    alert: "text-red-600 dark:text-red-400",
  }[tone];
  const body = (
    <>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </div>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
    </>
  );
  const className = "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900";
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function MonthStatusBadge({ status }: { status: MonthStatus }) {
  if (status === "MISSING") {
    return (
      <span className="inline-flex whitespace-nowrap rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-200">
        Missing
      </span>
    );
  }
  if (status === "NOT_STARTED") {
    return (
      <span className="inline-flex whitespace-nowrap rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-900 dark:text-gray-300">
        Not started
      </span>
    );
  }
  return <TimesheetStatusBadge status={status} />;
}

function MonthTable({ rows, monthStart, emptyText }: { rows: MonthRow[]; monthStart: string; emptyText: string }) {
  if (!rows.length) return <p className="text-sm text-gray-400">{emptyText}</p>;
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {rows.map((row) => {
        const needsStart = row.status === "NOT_STARTED" || row.status === "MISSING";
        const href = row.timesheetId ? `/timesheets/${row.timesheetId}` : newTimesheetHref(row.projectId, monthStart);
        const actionLabel = needsStart
          ? "Log time"
          : row.status === "DRAFT"
            ? row.rejectReason
              ? "Fix & resubmit"
              : "Continue"
            : "View";
        return (
          <li key={row.projectId} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{row.projectLabel}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <MonthStatusBadge status={row.status} />
                {row.hours > 0 ? <span className="tabular-nums">{formatHours(row.hours)}</span> : null}
                {row.rejectReason ? (
                  <span className="text-red-600 dark:text-red-400">Returned: {row.rejectReason}</span>
                ) : null}
              </div>
            </div>
            <Link
              href={href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                needsStart || row.rejectReason
                  ? "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black"
                  : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              }`}
            >
              {actionLabel}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const ACTION_META: Record<ActionKind, { icon: ReactNode; className: string }> = {
  AGREEMENT: { icon: <FileSignature className="h-4 w-4" />, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
  PROFILE: { icon: <UserRound className="h-4 w-4" />, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  RETURNED: { icon: <Undo2 className="h-4 w-4" />, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
  OVERDUE_DRAFT: { icon: <FileWarning className="h-4 w-4" />, className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  MISSING: { icon: <AlertTriangle className="h-4 w-4" />, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
};

const ACTIVITY_LABELS: Record<string, { label: string; dot: string }> = {
  SUBMITTED: { label: "Submitted", dot: "bg-amber-500" },
  APPROVED: { label: "Approved", dot: "bg-green-600" },
  REJECTED: { label: "Returned", dot: "bg-red-500" },
};

function WeeklyHoursChart({ rows }: { rows: MemberDashboard["weeklyHours"] }) {
  const max = Math.max(...rows.map((r) => r.approved + r.submitted + r.draft), 40);
  return (
    <div>
      <div className="flex h-44 items-end gap-3 border-b border-gray-100 pb-1 dark:border-gray-800">
        {rows.map((row) => {
          const total = row.approved + row.submitted + row.draft;
          return (
            <div key={row.weekStart} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[11px] tabular-nums text-gray-600 dark:text-gray-400">{total ? formatHours(total) : ""}</span>
              <div className="flex h-32 w-full max-w-10 flex-col-reverse overflow-hidden rounded-t" title={`${total} h`}>
                <div className="bg-green-600" style={{ height: `${(row.approved / max) * 100}%` }} />
                <div className="bg-amber-400" style={{ height: `${(row.submitted / max) * 100}%` }} />
                <div className="bg-gray-300 dark:bg-gray-600" style={{ height: `${(row.draft / max) * 100}%` }} />
              </div>
              <span className="whitespace-nowrap text-[11px] text-gray-500">{formatDay(row.weekStart)}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-600" /> Approved</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Awaiting approval</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gray-300" /> Draft</span>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const router = useRouter();
  const { role, additionalRoles, userId, loading: sessionLoading, canCreateTimesheets } = useAdminSession();
  const portalOnly = role === "client" || isRestrictedToWorkspaceOnly(role, additionalRoles);
  const [data, setData] = useState<MemberDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { dismissed, dismiss, restoreAll } = useDismissedToday("workspace-attention", userId);

  useEffect(() => {
    if (!sessionLoading && portalOnly) router.replace(defaultLandingPath(role, additionalRoles));
  }, [sessionLoading, portalOnly, role, additionalRoles, router]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    void adminFetch("/api/admin/member-dashboard")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load dashboard");
        setData(body.data as MemberDashboard);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (sessionLoading || portalOnly) return;
    load();
  }, [load, sessionLoading, portalOnly]);

  const firstName = data?.userName.split(/\s+/)[0] ?? "";
  const kpis = data?.kpis;
  const readyToWork = data && !data.onboarding.agreementPending && !data.onboarding.profilePending;
  const visibleActionItems = useMemo(
    () => (data?.actionItems ?? []).filter((item) => !dismissed.has(item.id)),
    [data, dismissed],
  );
  const hiddenCount = (data?.actionItems.length ?? 0) - visibleActionItems.length;
  const lastMonthName = kpis
    ? new Date(kpis.lastMonthLabel).toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" })
    : "";

  if (sessionLoading || portalOnly) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
      <div className="space-y-6">
        <MyDayPanel />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {firstName ? `Welcome back, ${firstName}` : "Workspace"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data ? `This month: ${formatMonth(data.monthStart)}` : "Loading…"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            {canCreateTimesheets ? (
              <>
                <Link
                  href="/timesheets"
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  My timesheets
                </Link>
                <Link
                  href="/timesheets/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black"
                >
                  <Plus className="h-4 w-4" /> Log time
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        {loading && !data ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : data && kpis ? (
          <>
            {visibleActionItems.length ? (
              <Card
                title="Needs your attention"
                subtitle="Clear these to keep your timesheets and payments on track"
                actions={
                  hiddenCount > 0 ? (
                    <button type="button" onClick={restoreAll} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                      Show {hiddenCount} dismissed
                    </button>
                  ) : null
                }
              >
                <ul className="space-y-2">
                  {visibleActionItems.map((item) => {
                    const meta = ACTION_META[item.kind];
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 rounded-lg border border-gray-100 transition-colors hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                      >
                        <Link href={item.href} className="flex min-w-0 flex-1 items-start gap-3 p-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                            {meta.icon}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</span>
                            <span className="block text-sm text-gray-600 dark:text-gray-400">{item.detail}</span>
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => dismiss(item.id)}
                          className="m-2 shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                          aria-label={`Dismiss: ${item.title}`}
                          title="Dismiss for today"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                <span className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  {hiddenCount > 0
                    ? "Nothing else needs your attention today."
                    : "You're all caught up. No timesheets are missing, returned or waiting on you."}
                </span>
                {hiddenCount > 0 ? (
                  <button type="button" onClick={restoreAll} className="text-xs font-medium underline">
                    Show {hiddenCount} dismissed
                  </button>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Kpi
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Hours this week"
                value={formatHours(kpis.hoursThisWeek)}
                hint={formatWeek(data.weekStart, data.weekEnd)}
              />
              <Kpi
                icon={<FolderKanban className="h-3.5 w-3.5" />}
                label="Active projects"
                value={kpis.activeProjects}
                hint={kpis.activeProjects === 1 ? "project you're logging time on" : "projects you're logging time on"}
              />
              <Kpi
                icon={<CalendarClock className="h-3.5 w-3.5" />}
                label="Awaiting approval"
                value={kpis.awaitingApproval.count}
                hint={`${formatHours(kpis.awaitingApproval.hours)} with your approver`}
                tone={kpis.awaitingApproval.count ? "warn" : "default"}
                href={canCreateTimesheets ? "/timesheets" : undefined}
              />
              <Kpi
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                label="Approved this month"
                value={formatHours(kpis.approvedHoursThisMonth)}
                hint={new Date(data.today).toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" })}
                tone="good"
              />
              <Kpi
                icon={<CalendarCheck className="h-3.5 w-3.5" />}
                label="Approved last month"
                value={formatHours(kpis.approvedHoursLastMonth)}
                hint={lastMonthName}
              />
              <Kpi
                icon={<FileSignature className="h-3.5 w-3.5" />}
                label="Account status"
                value={readyToWork ? "Ready" : "Action needed"}
                hint={
                  data.onboarding.agreementPending
                    ? "agreement not signed"
                    : data.onboarding.profilePending
                      ? "profile incomplete"
                      : data.isProjectMember
                        ? "agreement signed, profile complete"
                        : "nothing outstanding"
                }
                tone={readyToWork ? "good" : "alert"}
                href={data.onboarding.agreementPending ? "/agreement" : "/settings/profile"}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="This month" subtitle={formatMonth(data.monthStart)}>
                <MonthTable rows={data.thisMonth} monthStart={data.monthStart} emptyText="No active projects this month." />
              </Card>
              <Card title="Last month" subtitle={formatMonth(data.lastMonthStart)}>
                <MonthTable rows={data.lastMonth} monthStart={data.lastMonthStart} emptyText="No active projects last month." />
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card title="Hours logged" subtitle="Last 8 weeks, by timesheet status">
                  <WeeklyHoursChart rows={data.weeklyHours} />
                </Card>
              </div>
              <Card title="My projects" subtitle="Projects you're a member of">
              {data.projects.length === 0 ? (
                <p className="text-sm text-gray-400">You haven&apos;t been added to any projects yet.</p>
              ) : (
                <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                  {data.projects.map((project) => (
                    <div key={project.id} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900 dark:text-gray-100" title={project.title}>
                            {project.projectNumber} · {project.title}
                          </p>
                          <p className="truncate text-xs text-gray-500">{project.clientName}</p>
                        </div>
                        <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs text-gray-500">
                          <span>
                            {formatDay(project.startDate, true)} – {formatDay(project.endDate, true)}
                          </span>
                          <span>{project.ended ? "Ended" : `${project.remainingDays} days left`}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className={`h-full rounded-full ${project.ended ? "bg-gray-400" : "bg-black dark:bg-white"}`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <dt className="text-gray-500">Project manager</dt>
                        <dd className="truncate text-right text-gray-800 dark:text-gray-200">{project.projectManager}</dd>
                        <dt className="text-gray-500">Hours this month</dt>
                        <dd className="text-right tabular-nums text-gray-800 dark:text-gray-200">{formatHours(project.hoursThisMonth)}</dd>
                        <dt className="text-gray-500">Hours last month</dt>
                        <dd className="text-right tabular-nums text-gray-800 dark:text-gray-200">{formatHours(project.hoursLastMonth)}</dd>
                      </dl>
                      {project.status === "ACTIVE" && !project.ended ? (
                        <Link
                          href={newTimesheetHref(project.id, data.monthStart)}
                          className="mt-3 inline-flex text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Log time for this month →
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              </Card>
            </div>

            <Card title="Recent activity" subtitle="Latest updates on your timesheets">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet.</p>
              ) : (
                <ol className="grid gap-4 sm:grid-cols-3">
                  {data.recentActivity.map((item) => {
                    const meta = ACTIVITY_LABELS[item.action] ?? { label: item.action, dot: "bg-gray-400" };
                    return (
                      <li key={item.id} className="flex gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                        <Link href={`/timesheets/${item.timesheetId}`} className="min-w-0 hover:underline">
                          <span className="block text-sm text-gray-900 dark:text-gray-100">
                            <span className="font-medium">{meta.label}</span> · {formatMonth(item.weekStart)}
                          </span>
                          <span className="block truncate text-xs text-gray-500">{item.projectLabel}</span>
                          {item.reason ? (
                            <span
                              className={`block text-xs ${
                                item.action === "REJECTED" ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              “{item.reason}”
                            </span>
                          ) : null}
                          <span className="block text-xs text-gray-400">
                            {item.performedBy ? `${item.performedBy} · ` : ""}
                            {relativeTime(item.createdAt)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>
          </>
        ) : null}
      </div>
  );
}
