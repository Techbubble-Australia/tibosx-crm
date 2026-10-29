"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TablePagination } from "@/components/ui/TablePagination";
import { SortableTh, toggleSortKey, type SortDir } from "@/components/ui/SortableTh";
import Link from "next/link";
import { Plus } from "lucide-react";
import { workspaceFetch } from "@/lib/workspace-fetch";
import {
  TICKET_STATUS_FILTER_ENTRIES,
  normalizeTicketStatusKey,
  ticketStatusLabel,
} from "@/lib/support-ticket-labels";
import { TicketPriorityBadge } from "@/lib/ticket-priority-styles";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";
import { EmptyTickets } from "@/components/workspace/EmptyTickets";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";

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

const CARD_STATUS_ORDER = [
  "OPEN",
  "IN_PROGRESS",
  "PENDING_CLIENT",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const;

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [status, setStatus] = useState(() => searchParams.get("status")?.trim().toUpperCase() ?? "");
  const [q, setQ] = useState("");
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

  function handleSort(
    key: "ticketNumber" | "subject" | "project" | "priority" | "status" | "updatedAt",
  ) {
    const next = toggleSortKey(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.dir);
    setPage(1);
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim().length >= 2) params.set("q", q.trim());
    void workspaceFetch(`/tickets?${params}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data as TicketRow[]) ?? []));
  }, [status, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, TicketRow[]>();
    for (const row of rows) {
      const key = normalizeTicketStatusKey(row.status) || "OPEN";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return CARD_STATUS_ORDER
      .map((key) => ({ key, label: ticketStatusLabel(key), items: map.get(key) ?? [] }))
      .filter((section) => section.items.length > 0);
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Tickets</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <Link
            href="/workspace/tickets/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" /> Create ticket
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
      ) : viewMode === "card" ? (
        <div className="space-y-8">
          {grouped.map((section) => (
            <section key={section.key}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{section.label}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.items.map((row) => {
                  const projectName = row.projectLabel?.trim() || "—";
                  return (
                    <Link
                      key={row.id}
                      href={`/workspace/tickets/${row.id}`}
                      className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="font-semibold text-sky-700">{row.ticketNumber}</span>
                        <TicketStatusBadge status={row.status} />
                      </div>
                      <p className="mb-1 line-clamp-2 font-medium text-gray-900">{row.subject}</p>
                      <p className="mb-3 line-clamp-1 text-xs text-gray-500">{projectName}</p>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <TicketPriorityBadge priority={row.priority} />
                        <span className="text-xs text-gray-400">
                          {new Date(row.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-gray-500">
              <tr>
                <SortableTh label="Ticket #" sortKey="ticketNumber" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                <SortableTh label="Subject" sortKey="subject" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                <SortableTh label="Project" sortKey="project" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                <SortableTh label="Priority" sortKey="priority" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                <SortableTh label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="min-w-[11rem] whitespace-nowrap px-4 py-3" />
                <th className="whitespace-nowrap px-4 py-3">Assigned to</th>
                <SortableTh label="Updated" sortKey="updatedAt" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagedRows.map((row) => {
                const projectName = row.projectLabel?.trim() || "—";
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
                    <td className="whitespace-nowrap px-4 py-3">
                      <TicketStatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {row.assignedTo?.name ?? "Unassigned"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {new Date(row.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
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
