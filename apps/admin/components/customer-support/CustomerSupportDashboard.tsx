"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { normalizeTicketStatusKey } from "@/lib/support-ticket-labels";
import { TicketPriorityBadge } from "@/lib/ticket-priority-styles";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";
import { EmptyTickets } from "@/components/workspace/EmptyTickets";
import { TICKET_STATUS_LABELS } from "@/lib/support-ticket-labels";

export type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  type: string;
  priority: string;
  updatedAt: string;
  projectLabel?: string | null;
};

export type ActivityRow = {
  id: string;
  action: string;
  ticketNumber: string;
  subject: string;
  createdAt: string;
  actorName: string;
};

export type TimesheetSummary = {
  total: number;
  pendingApproval: number;
};

export type SubmittedTimesheetRow = {
  id: string;
  status?: string;
  memberName: string;
  projectLabel: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
};

type Props = {
  ticketDetailHref: (id: string) => string;
  timesheetDetailHref?: (id: string) => string;
  ticketsListHref: string;
  timesheetsHref: string;
  loadTickets: () => Promise<TicketRow[]>;
  loadActivity: () => Promise<ActivityRow[]>;
  loadTimesheetSummary?: () => Promise<TimesheetSummary>;
  loadRecentSubmittedTimesheets?: () => Promise<SubmittedTimesheetRow[]>;
  showTimesheetSummary?: boolean;
  /** When false, the right-hand column shows a tickets-by-status chart instead of timesheets. */
  showTimesheetsWidget?: boolean;
  subtitle?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function formatTimesheetPeriod(startDate: string, endDate: string) {
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function CustomerSupportDashboard({
  ticketDetailHref,
  timesheetDetailHref = (id) => `/timesheets/${id}`,
  ticketsListHref,
  timesheetsHref,
  loadTickets,
  loadActivity,
  loadTimesheetSummary,
  loadRecentSubmittedTimesheets,
  showTimesheetSummary = false,
  showTimesheetsWidget = false,
  subtitle = "Track ticket status at a glance.",
}: Props) {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetSummary>({ total: 0, pendingApproval: 0 });
  const [recentSubmitted, setRecentSubmitted] = useState<SubmittedTimesheetRow[]>([]);

  useEffect(() => {
    void loadTickets().then(setRows).catch(() => setRows([]));
    void loadActivity().then(setActivity).catch(() => setActivity([]));
    if (showTimesheetSummary && loadTimesheetSummary) {
      void loadTimesheetSummary()
        .then(setTimesheets)
        .catch(() => setTimesheets({ total: 0, pendingApproval: 0 }));
    }
    if (showTimesheetsWidget && loadRecentSubmittedTimesheets) {
      void loadRecentSubmittedTimesheets()
        .then(setRecentSubmitted)
        .catch(() => setRecentSubmitted([]));
    }
  }, [
    loadTickets,
    loadActivity,
    loadTimesheetSummary,
    loadRecentSubmittedTimesheets,
    showTimesheetSummary,
    showTimesheetsWidget,
  ]);

  const counts = useMemo(() => {
    let open = 0;
    let awaitingResponse = 0;
    let inProgress = 0;
    let resolved = 0;
    for (const row of rows) {
      const key = normalizeTicketStatusKey(row.status);
      if (key === "OPEN") open += 1;
      else if (key === "PENDING_CLIENT") awaitingResponse += 1;
      else if (key === "IN_PROGRESS") inProgress += 1;
      else if (key === "RESOLVED") resolved += 1;
    }
    return { open, awaitingResponse, inProgress, resolved };
  }, [rows]);

  const needsAttention = useMemo(
    () =>
      [...rows]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3),
    [rows],
  );

  const recentActivity = activity.slice(0, 3);

  const statusChart = useMemo(() => {
    const keys = ["OPEN", "IN_PROGRESS", "PENDING_CLIENT", "RESOLVED", "CLOSED", "CANCELLED"] as const;
    const counts = new Map<string, number>();
    for (const key of keys) counts.set(key, 0);
    for (const row of rows) {
      const key = normalizeTicketStatusKey(row.status);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const max = Math.max(1, ...keys.map((k) => counts.get(k) ?? 0));
    return keys.map((key) => ({
      key,
      label: TICKET_STATUS_LABELS[key] ?? key,
      count: counts.get(key) ?? 0,
      max,
    }));
  }, [rows]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Open tickets</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{counts.open}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Awaiting response</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{counts.awaitingResponse}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">In progress</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{counts.inProgress}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{counts.resolved}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Needs attention</h2>
            <Link href={ticketsListHref} className="text-sm text-sky-600 hover:underline">View all tickets</Link>
          </div>
          {needsAttention.length === 0 ? (
            <p className="text-sm text-gray-500">No tickets yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {needsAttention.map((row) => (
                <li
                  key={row.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_7.5rem] items-center gap-x-3 gap-y-1 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <Link href={ticketDetailHref(row.id)} className="font-medium text-sky-600 hover:underline">
                      {row.ticketNumber}
                    </Link>
                    <p className="truncate text-gray-700 dark:text-gray-300">{row.subject}</p>
                  </div>
                  <div className="justify-self-end">
                    <TicketPriorityBadge priority={row.priority} />
                  </div>
                  <div className="justify-self-end">
                    <TicketStatusBadge status={row.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {showTimesheetsWidget ? (
          <section className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Timesheets</h2>
              <Link href={timesheetsHref} className="text-sm text-sky-600 hover:underline">View timesheets</Link>
            </div>
            {showTimesheetSummary ? (
              <p className="mb-2 text-xs text-gray-500">
                {timesheets.pendingApproval} awaiting approval · {timesheets.total} total
              </p>
            ) : null}
            {recentSubmitted.length === 0 ? (
              <p className="text-sm text-gray-500">No submitted timesheets yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentSubmitted.slice(0, 3).map((row) => (
                  <li
                    key={row.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <Link
                        href={timesheetDetailHref(row.id)}
                        className="font-medium text-sky-600 hover:underline"
                      >
                        {formatTimesheetPeriod(row.startDate, row.endDate)}
                      </Link>
                      <p className="truncate text-gray-700 dark:text-gray-300">{row.memberName}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Tickets by status</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-gray-500">No tickets yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {statusChart.map((bar) => (
                  <li key={bar.key} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-sm">
                    <span className="truncate text-gray-600 dark:text-gray-400" title={bar.label}>{bar.label}</span>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{ width: `${(bar.count / bar.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-right font-medium text-gray-900 dark:text-gray-100">{bar.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent activity</h2>
          <Link href={ticketsListHref} className="text-sm text-sky-600 hover:underline">View tickets</Link>
        </div>
        {recentActivity.length === 0 ? (
          <EmptyTickets />
        ) : (
          <ul className="relative space-y-0 border-l-2 border-sky-200 pl-4 dark:border-sky-800">
            {recentActivity.map((row) => (
              <li key={`${row.id}-${row.createdAt}`} className="relative pb-3">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  <Link href={ticketDetailHref(row.id)} className="text-sky-700 hover:underline dark:text-sky-400">
                    {row.ticketNumber}
                  </Link>
                  {" · "}
                  {row.action.replaceAll("_", " ")}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{row.subject}</p>
                <p className="text-xs text-slate-400">
                  {new Date(row.createdAt).toLocaleString()}
                  {row.actorName ? ` · ${row.actorName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
