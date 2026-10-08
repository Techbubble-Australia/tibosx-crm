"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ticketingFetch } from "@/lib/ticketing-fetch";
import { TICKET_PRIORITY_LABELS, TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from "@/lib/ticket-labels";
import { EmptyTickets } from "@/components/PortalShell";

type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  type: string;
  priority: string;
  organization?: { name: string };
  updatedAt: string;
};

export default function TicketsPage() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    void ticketingFetch(`/api/tickets?${params}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data as TicketRow[]) ?? []));
  }, [status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      {rows.length === 0 ? (
        <EmptyTickets />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${row.id}`} className="font-medium text-blue-600 hover:underline">
                      {row.ticketNumber}
                    </Link>
                    <p className="text-gray-700">{row.subject}</p>
                    {row.organization ? <p className="text-xs text-gray-400">{row.organization.name}</p> : null}
                  </td>
                  <td className="px-4 py-3">{TICKET_TYPE_LABELS[row.type]}</td>
                  <td className="px-4 py-3">{TICKET_PRIORITY_LABELS[row.priority]}</td>
                  <td className="px-4 py-3">{TICKET_STATUS_LABELS[row.status]}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(row.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
