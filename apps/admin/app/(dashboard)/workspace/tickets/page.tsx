"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { TICKET_STATUS_FILTER_ENTRIES } from "@/lib/support-ticket-labels";
import { TicketPriorityBadge } from "@/lib/ticket-priority-styles";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";
import { EmptyTickets } from "@/components/workspace/EmptyTickets";

type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  projectLabel?: string | null;
  organization?: { name: string };
  createdBy?: { name: string };
  createdAt: string;
  updatedAt: string;
  updatedBy?: { name: string } | null;
  assignedTo?: { id: string; name: string; email: string } | null;
};

export default function TicketsPage() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim().length >= 2) params.set("q", q.trim());
    void workspaceFetch(`/tickets?${params}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data as TicketRow[]) ?? []));
  }, [status, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Tickets</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/workspace/tickets/new"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Create ticket
          </Link>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ticket # or subject"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {TICKET_STATUS_FILTER_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyTickets />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Ticket #</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created by</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Updated by</th>
                <th className="px-4 py-3">Assigned to</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const projectName = row.projectLabel ?? row.organization?.name ?? "—";
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="max-w-[8rem] px-4 py-3">
                      <Link
                        href={`/workspace/tickets/${row.id}`}
                        className="block truncate font-medium text-blue-600 hover:underline"
                        title={row.ticketNumber}
                      >
                        {row.ticketNumber}
                      </Link>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <span className="block truncate text-gray-700" title={row.subject}>{row.subject}</span>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <span className="block truncate text-gray-600" title={projectName}>{projectName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <TicketPriorityBadge priority={row.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <TicketStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.createdBy?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(row.updatedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{row.updatedBy?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{row.assignedTo?.name ?? "Unassigned"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
