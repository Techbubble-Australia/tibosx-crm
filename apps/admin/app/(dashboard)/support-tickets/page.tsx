"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { TICKET_STATUS_FILTER_ENTRIES } from "@/lib/support-ticket-labels";
import { TicketPriorityBadge } from "@/lib/ticket-priority-styles";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";

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
  updatedBy?: { name: string; email?: string } | null;
  assignedTo?: { id: string; name: string; email: string } | null;
};

export default function SupportTicketsPage() {
  const { role } = useAdminSession();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [status, setStatus] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteTicket(row: TicketRow) {
    if (role !== "admin") return;
    if (!(await appConfirm(`Delete ticket ${row.ticketNumber}? This cannot be undone.`))) return;
    setDeletingId(row.id);
    try {
      const res = await adminFetch(`/api/admin/ticketing/tickets/${row.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to delete ticket");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete ticket");
    } finally {
      setDeletingId(null);
    }
  }

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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tickets</h1>
          <p className="text-sm text-gray-500">
            {role === "admin" ? "All client support projects" : "Projects assigned to you"}
          </p>
        </div>
        <Link
          href="/support-tickets/new"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Create ticket
        </Link>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="">All statuses</option>
          {TICKET_STATUS_FILTER_ENTRIES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="">All projects</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-gray-500 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3">Ticket #</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Priority</th>
              <th className="min-w-[11rem] whitespace-nowrap px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3">Assigned to</th>
              <th className="whitespace-nowrap px-4 py-3">Updated</th>
              {role === "admin" ? <th className="px-4 py-3 w-12" aria-label="Actions" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={role === "admin" ? 8 : 7} className="px-4 py-8 text-center text-gray-500">No tickets found.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="max-w-[8rem] px-4 py-3">
                    <Link
                      href={`/support-tickets/${row.id}`}
                      className="block truncate font-medium text-blue-600 hover:underline"
                      title={row.ticketNumber}
                    >
                      {row.ticketNumber}
                    </Link>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <span className="block truncate text-gray-700 dark:text-gray-300" title={row.subject}>
                      {row.subject}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <span
                      className="block truncate text-gray-600 dark:text-gray-400"
                      title={row.projectLabel?.trim() ?? ""}
                    >
                      {row.projectLabel?.trim() || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <TicketPriorityBadge priority={row.priority} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <TicketStatusBadge status={row.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                    {row.assignedTo?.name ?? "Unassigned"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(row.updatedAt).toLocaleString()}
                  </td>
                  {role === "admin" ? (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={deletingId === row.id}
                        onClick={() => void deleteTicket(row)}
                        className="rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
                        aria-label={`Delete ${row.ticketNumber}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
