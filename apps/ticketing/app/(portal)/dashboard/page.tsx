"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { ticketingFetch } from "@/lib/ticketing-fetch";
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from "@/lib/ticket-labels";
import { EmptyTickets } from "@/components/PortalShell";

type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  type: string;
  priority: string;
  updatedAt: string;
};

type ActivityRow = {
  id: string;
  action: string;
  ticketNumber: string;
  subject: string;
  createdAt: string;
  actorName: string;
};

type TimesheetSummary = {
  total: number;
  pendingApproval: number;
};

export default function DashboardPage() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetSummary>({ total: 0, pendingApproval: 0 });
  const [role, setRole] = useState<string>("CLIENT");

  useEffect(() => {
    void ticketingFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setRole((data.data as { role: string }).role));
    void ticketingFetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => setRows((data.data as TicketRow[]) ?? []));
    void ticketingFetch("/api/tickets/activity/recent")
      .then((res) => res.json())
      .then((data) => setActivity((data.data as ActivityRow[]) ?? []))
      .catch(() => setActivity([]));
    void ticketingFetch("/api/timesheets/summary")
      .then((res) => res.json())
      .then((data) => setTimesheets((data.data as TimesheetSummary) ?? { total: 0, pendingApproval: 0 }))
      .catch(() => setTimesheets({ total: 0, pendingApproval: 0 }));
  }, []);

  const open = rows.filter((r) => !["CLOSED", "RESOLVED"].includes(r.status));
  const isClient = role === "CLIENT";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500">Track active requests and recent updates.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Open tickets</p>
          <p className="text-3xl font-semibold">{open.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total tickets</p>
          <p className="text-3xl font-semibold">{rows.length}</p>
        </div>
        {isClient ? (
          <>
            <Link
              href="/timesheets"
              className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
            >
              <p className="text-sm text-gray-500">Timesheets awaiting approval</p>
              <p className="text-3xl font-semibold">{timesheets.pendingApproval}</p>
            </Link>
            <Link
              href="/timesheets"
              className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
            >
              <p className="text-sm text-gray-500">Total timesheets</p>
              <p className="text-3xl font-semibold">{timesheets.total}</p>
            </Link>
          </>
        ) : null}
      </div>

      {isClient ? (
        <Link
          href="/timesheets"
          className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 hover:bg-sky-100"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-sky-600" />
            <div>
              <p className="font-medium">Timesheets</p>
              <p className="text-sm text-sky-700">
                {timesheets.pendingApproval > 0
                  ? `${timesheets.pendingApproval} awaiting approval · ${timesheets.total} total`
                  : `${timesheets.total} on your project`}
              </p>
            </div>
          </div>
          <span className="text-sm font-medium">Open →</span>
        </Link>
      ) : null}

      <section>
        <h2 className="mb-3 font-semibold">Recent activity</h2>
        {activity.length === 0 ? (
          <EmptyTickets />
        ) : (
          <ul className="relative space-y-0 border-l-2 border-sky-200 pl-4">
            {activity.slice(0, 12).map((row) => (
              <li key={row.id} className="relative pb-4">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500" />
                <p className="text-sm font-medium text-slate-900">
                  <Link href={`/tickets/${row.id}`} className="text-sky-700 hover:underline">
                    {row.ticketNumber}
                  </Link>
                  {" · "}
                  {row.action.replaceAll("_", " ")}
                </p>
                <p className="text-sm text-slate-600">{row.subject}</p>
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
          <h2 className="mb-3 font-semibold">Tickets</h2>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {rows.slice(0, 5).map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <Link href={`/tickets/${row.id}`} className="font-medium text-blue-600 hover:underline">
                    {row.ticketNumber}
                  </Link>
                  <p className="text-gray-700">{row.subject}</p>
                  <p className="text-xs text-gray-500">
                    {TICKET_TYPE_LABELS[row.type] ?? row.type} · {TICKET_STATUS_LABELS[row.status] ?? row.status}
                  </p>
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
