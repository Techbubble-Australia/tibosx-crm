"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { isOpenTicketStatus, TICKET_TYPE_LABELS } from "@/lib/support-ticket-labels";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";
import { EmptyTickets } from "@/components/workspace/EmptyTickets";

export type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  type: string;
  priority: string;
  updatedAt: string;
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

type Props = {
  ticketDetailHref: (id: string) => string;
  ticketsListHref: string;
  timesheetsHref: string;
  loadTickets: () => Promise<TicketRow[]>;
  loadActivity: () => Promise<ActivityRow[]>;
  loadTimesheetSummary: () => Promise<TimesheetSummary>;
  showTimesheetSummary: boolean;
};

export function CustomerSupportDashboard({
  ticketDetailHref,
  ticketsListHref,
  timesheetsHref,
  loadTickets,
  loadActivity,
  loadTimesheetSummary,
  showTimesheetSummary,
}: Props) {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetSummary>({ total: 0, pendingApproval: 0 });

  useEffect(() => {
    void loadTickets().then(setRows).catch(() => setRows([]));
    void loadActivity().then(setActivity).catch(() => setActivity([]));
    if (showTimesheetSummary) {
      void loadTimesheetSummary()
        .then(setTimesheets)
        .catch(() => setTimesheets({ total: 0, pendingApproval: 0 }));
    }
  }, [loadTickets, loadActivity, loadTimesheetSummary, showTimesheetSummary]);

  const open = rows.filter((r) => isOpenTicketStatus(r.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500">Track ticket and timesheet status at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Open tickets</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{open.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Total tickets</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{rows.length}</p>
        </div>
        {showTimesheetSummary ? (
          <>
            <Link
              href={timesheetsHref}
              className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-sky-800"
            >
              <p className="text-sm text-gray-500">Timesheets awaiting approval</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{timesheets.pendingApproval}</p>
            </Link>
            <Link
              href={timesheetsHref}
              className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-sky-800"
            >
              <p className="text-sm text-gray-500">Total timesheets</p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{timesheets.total}</p>
            </Link>
          </>
        ) : null}
      </div>

      {showTimesheetSummary ? (
        <Link
          href={timesheetsHref}
          className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-sky-600" />
            <div>
              <p className="font-medium">Timesheets</p>
              <p className="text-sm text-sky-700 dark:text-sky-300">
                {timesheets.pendingApproval > 0
                  ? `${timesheets.pendingApproval} awaiting approval · ${timesheets.total} total`
                  : `${timesheets.total} on support projects`}
              </p>
            </div>
          </div>
          <span className="text-sm font-medium">Open →</span>
        </Link>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent activity</h2>
          <Link href={ticketsListHref} className="text-sm text-sky-600 hover:underline">View tickets</Link>
        </div>
        {activity.length === 0 ? (
          <EmptyTickets />
        ) : (
          <ul className="relative space-y-0 border-l-2 border-sky-200 pl-4 dark:border-sky-800">
            {activity.slice(0, 12).map((row) => (
              <li key={`${row.id}-${row.createdAt}`} className="relative pb-4">
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

      {rows.length > 0 ? (
        <section>
          <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Tickets</h2>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
            {rows.slice(0, 5).map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <Link href={ticketDetailHref(row.id)} className="font-medium text-blue-600 hover:underline">
                    {row.ticketNumber}
                  </Link>
                  <p className="text-gray-700 dark:text-gray-300">{row.subject}</p>
                  <p className="text-xs text-gray-500">
                    {TICKET_TYPE_LABELS[row.type] ?? row.type}
                  </p>
                  <div className="mt-1">
                    <TicketStatusBadge status={row.status} />
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(row.updatedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
