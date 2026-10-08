"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ticketingFetch } from "@/lib/ticketing-fetch";
import { TICKET_STATUS_LABELS } from "@/lib/ticket-labels";

type Org = { id: string; name: string };
type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  organization?: { name: string };
};

export default function ConsultantPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgFilter, setOrgFilter] = useState("");
  const [rows, setRows] = useState<TicketRow[]>([]);

  useEffect(() => {
    void ticketingFetch("/api/organizations")
      .then((res) => res.json())
      .then((data) => setOrgs((data.data as Org[]) ?? []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (orgFilter) params.set("organizationId", orgFilter);
    void ticketingFetch(`/api/tickets?${params}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data as TicketRow[]) ?? []));
  }, [orgFilter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Consultant queue</h1>
      <p className="text-sm text-gray-500">Manage tickets across all client organizations.</p>
      <select
        value={orgFilter}
        onChange={(e) => setOrgFilter(e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        <option value="">All organizations</option>
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <ul className="divide-y rounded-xl border border-gray-200 bg-white">
        {rows.map((row) => (
          <li key={row.id} className="flex justify-between gap-2 px-4 py-3 text-sm">
            <div>
              <Link href={`/tickets/${row.id}`} className="font-medium text-blue-600 hover:underline">
                {row.ticketNumber}
              </Link>
              <p>{row.subject}</p>
              <p className="text-xs text-gray-500">{row.organization?.name}</p>
            </div>
            <span className="text-gray-600">{TICKET_STATUS_LABELS[row.status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
