"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";

type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  type: string;
  organization?: { name: string };
  updatedAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  PENDING_CLIENT: "Pending client",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default function SupportTicketsPage() {
  const { role } = useAdminSession();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [status, setStatus] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void adminFetch("/api/admin/ticketing/organizations")
      .then((res) => res.json())
      .then((data) => setOrgs((data.data as { id: string; name: string }[]) ?? []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (organizationId) params.set("organizationId", organizationId);
    void adminFetch(`/api/admin/ticketing/tickets?${params}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load tickets");
        setRows((data.data as TicketRow[]) ?? []);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [status, organizationId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Support tickets</h1>
          <p className="text-sm text-gray-500">
            {role === "admin" ? "All client organizations" : "Organizations assigned to you"}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          {role === "admin" ? (
            <Link href="/support-tickets/assignments" className="font-medium text-blue-600 hover:underline">
              Consultant access
            </Link>
          ) : null}
          <a href="/api/ticketing/launch" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
            Open full portal →
          </a>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="">All companies</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-gray-500 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No tickets found.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/support-tickets/${row.id}`} className="font-medium text-blue-600 hover:underline">
                      {row.ticketNumber}
                    </Link>
                    <p className="text-gray-700 dark:text-gray-300">{row.subject}</p>
                  </td>
                  <td className="px-4 py-3">{row.organization?.name ?? "—"}</td>
                  <td className="px-4 py-3">{STATUS_LABELS[row.status] ?? row.status}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(row.updatedAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
