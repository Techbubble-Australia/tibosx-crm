"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TablePagination } from "@/components/ui/TablePagination";
import { SortableTh, toggleSortKey, type SortDir } from "@/components/ui/SortableTh";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import {
  TICKET_STATUS_FILTER_ENTRIES,
  normalizeTicketStatusKey,
  ticketStatusLabel,
} from "@/lib/support-ticket-labels";
import { TicketPriorityBadge } from "@/lib/ticket-priority-styles";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";

const CARD_STATUS_ORDER = [
  "OPEN",
  "IN_PROGRESS",
  "PENDING_CLIENT",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const;

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
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [status, setStatus] = useState(() => searchParams.get("status")?.trim().toUpperCase() ?? "");
  const [organizationId, setOrganizationId] = useState("");
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortKey, setSortKey] = useState<"ticketNumber" | "subject" | "project" | "priority" | "status" | "updatedAt">(
    "updatedAt",
  );
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const sortedRows = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case "ticketNumber":
          return a.ticketNumber.localeCompare(b.ticketNumber) * dir;
        case "subject":
          return a.subject.localeCompare(b.subject) * dir;
        case "project":
          return (a.projectLabel ?? "").localeCompare(b.projectLabel ?? "") * dir;
        case "priority":
          return a.priority.localeCompare(b.priority) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "updatedAt":
        default:
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
      }
    });
  }, [rows, sortKey, sortDir]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const groupedByStatus = useMemo(() => {
    const map = new Map<string, TicketRow[]>();
    for (const row of sortedRows) {
      const key = normalizeTicketStatusKey(row.status) || "OPEN";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return CARD_STATUS_ORDER
      .map((key) => ({ key, label: ticketStatusLabel(key), items: map.get(key) ?? [] }))
      .filter((section) => section.items.length > 0);
  }, [sortedRows]);

  function handleSort(
    key: "ticketNumber" | "subject" | "project" | "priority" | "status" | "updatedAt",
  ) {
    const next = toggleSortKey(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.dir);
    setPage(1);
  }

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tickets</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {role === "admin" ? "All client support projects" : "Projects assigned to you"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <Link
            href="/support-tickets/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" /> Create ticket
          </Link>
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

      {viewMode === "card" ? (
        rows.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            No tickets found.
          </p>
        ) : (
          <div className="space-y-8">
            {groupedByStatus.map((section) => (
              <section key={section.key}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{section.label}</h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {section.items.map((row) => (
                    <Link
                      key={row.id}
                      href={`/support-tickets/${row.id}`}
                      className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="font-semibold text-sky-700 dark:text-sky-400">{row.ticketNumber}</span>
                        <TicketStatusBadge status={row.status} />
                      </div>
                      <p className="mb-1 line-clamp-2 font-medium text-gray-900 dark:text-gray-100">{row.subject}</p>
                      <p className="mb-1 line-clamp-1 text-xs text-gray-500">{row.projectLabel?.trim() || "—"}</p>
                      <p className="mb-3 text-xs text-gray-500">{row.assignedTo?.name ?? "Unassigned"}</p>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <TicketPriorityBadge priority={row.priority} />
                        <span className="text-xs text-gray-400">{new Date(row.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-gray-500 dark:bg-gray-800">
            <tr>
              <SortableTh label="Ticket #" sortKey="ticketNumber" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
              <SortableTh label="Subject" sortKey="subject" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
              <SortableTh label="Project" sortKey="project" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
              <SortableTh label="Priority" sortKey="priority" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
              <SortableTh label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="min-w-[11rem] whitespace-nowrap px-4 py-3" />
              <th className="whitespace-nowrap px-4 py-3">Assigned to</th>
              <SortableTh label="Updated" sortKey="updatedAt" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap px-4 py-3" />
              {role === "admin" ? <th className="px-4 py-3 w-12" aria-label="Actions" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={role === "admin" ? 8 : 7} className="px-4 py-8 text-center text-gray-500">No tickets found.</td>
              </tr>
            ) : (
              pagedRows.map((row) => (
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
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={sortedRows.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>
      )}
    </div>
  );
}
