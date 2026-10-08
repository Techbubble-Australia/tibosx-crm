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

export default function DashboardPage() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [role, setRole] = useState<string>("CLIENT");
  const [canApproveTimesheets, setCanApproveTimesheets] = useState(false);
  const [pendingTimesheets, setPendingTimesheets] = useState(0);

  useEffect(() => {
    void ticketingFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const me = data.data as { role: string; canApproveTimesheets?: boolean };
        setRole(me.role);
        setCanApproveTimesheets(Boolean(me.canApproveTimesheets));
      });
    void ticketingFetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => setRows((data.data as TicketRow[]) ?? []));
    void ticketingFetch("/api/timesheets/pending-approval")
      .then((res) => res.json())
      .then((data) => setPendingTimesheets(((data.data as unknown[]) ?? []).length))
      .catch(() => setPendingTimesheets(0));
  }, []);

  const open = rows.filter((r) => !["CLOSED", "RESOLVED"].includes(r.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500">Track active requests and recent updates.</p>
      </div>
      {role === "CLIENT" && canApproveTimesheets ? (
        <Link
          href="/timesheets"
          className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 hover:bg-sky-100"
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-sky-600" />
            <div>
              <p className="font-medium">Timesheet approvals</p>
              <p className="text-sm text-sky-700">
                {pendingTimesheets > 0
                  ? `${pendingTimesheets} waiting for your review`
                  : "No timesheets pending"}
              </p>
            </div>
          </div>
          <span className="text-sm font-medium">Open →</span>
        </Link>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Open tickets</p>
          <p className="text-3xl font-semibold">{open.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total tickets</p>
          <p className="text-3xl font-semibold">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <Link href="/tickets/new" className="text-sm font-medium text-sky-600 hover:underline">
            {role === "CONSULTANT" ? "Create new ticket →" : "Submit a new request →"}
          </Link>
        </div>
      </div>
      <section>
        <h2 className="mb-3 font-semibold">Recent tickets</h2>
        {rows.length === 0 ? (
          <EmptyTickets />
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {rows.slice(0, 8).map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <Link href={`/tickets/${row.id}`} className="font-medium text-blue-600 hover:underline">
                    {row.ticketNumber}
                  </Link>
                  <p className="text-gray-700">{row.subject}</p>
                  <p className="text-xs text-gray-500">
                    {TICKET_TYPE_LABELS[row.type]} · {TICKET_STATUS_LABELS[row.status]}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{new Date(row.updatedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
