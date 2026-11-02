"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { FilterField } from "@/components/ui/FilterField";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  bulkAdvanceTargetStatus,
  formatEnvironment,
  formatTicketType,
  statusBadgeClass,
  typeBadgeClass,
  type TicketStatus,
} from "@/lib/tickets";

type TicketRow = {
  id: string;
  ticketId: string;
  type: string;
  status: TicketStatus;
  reportedEnvironment: string;
  userDescription: string;
  reporterEmail: string;
  createdAt: string;
};

type ReporterOption = {
  reporterUserId: string;
  reporterEmail: string;
};

function TicketsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reporterFilter, setReporterFilter] = useState<string>("");
  const [reporters, setReporters] = useState<ReporterOption[]>([]);
  const [filtersReady, setFiltersReady] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const filteredStatus = useMemo((): TicketStatus | null => {
    if (!statusFilter) return null;
    return TICKET_STATUSES.includes(statusFilter as TicketStatus) ? (statusFilter as TicketStatus) : null;
  }, [statusFilter]);

  const bulkTargetStatus = useMemo(
    () => (filteredStatus ? bulkAdvanceTargetStatus(filteredStatus) : null),
    [filteredStatus],
  );

  const showBulkActions = Boolean(bulkTargetStatus && filteredStatus);

  useEffect(() => {
    setSelectedIds(new Set());
    setBulkError("");
  }, [statusFilter, reporterFilter]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [meRes, repRes] = await Promise.all([
          fetch("/api/debug-portal/auth/me", { credentials: "include" }),
          fetch("/api/debug-portal/tickets/reporters", { credentials: "include" }),
        ]);
        const meJson = await meRes.json().catch(() => ({}));
        const repJson = await repRes.json().catch(() => ({}));
        if (cancelled) return;

        const sessionId =
          typeof meJson?.data?.user?.id === "string" ? (meJson.data.user.id as string) : "";
        if (Array.isArray(repJson?.data)) {
          setReporters(repJson.data as ReporterOption[]);
        }

        const fromUrl = searchParams.get("reporterUserId")?.trim() ?? "";
        if (fromUrl) {
          setReporterFilter(fromUrl);
        } else if (sessionId) {
          setReporterFilter(sessionId);
          const params = new URLSearchParams(searchParams.toString());
          params.set("reporterUserId", sessionId);
          router.replace(`/tickets?${params.toString()}`);
        }
      } finally {
        if (!cancelled) setFiltersReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  const onReporterChange = useCallback(
    (value: string) => {
      setReporterFilter(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("reporterUserId", value);
      else params.delete("reporterUserId");
      router.replace(params.toString() ? `/tickets?${params.toString()}` : "/tickets");
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    if (!filtersReady) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "50" });
      if (statusFilter) qs.set("status", statusFilter);
      if (reporterFilter) qs.set("reporterUserId", reporterFilter);
      const res = await fetch(`/api/debug-portal/tickets?${qs}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setRows(data.data ?? []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filtersReady, reporterFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const reporterOptions = reporters.length
    ? reporters
    : reporterFilter
      ? [{ reporterUserId: reporterFilter, reporterEmail: "Selected reporter" }]
      : [];

  const countLabel =
    total === 0 && !loading
      ? "No tickets match your filters"
      : `${total} ticket${total === 1 ? "" : "s"}`;

  const allVisibleSelected =
    rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const someVisibleSelected = rows.some((row) => selectedIds.has(row.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(rows.map((r) => r.id)));
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkAdvanceSelected() {
    if (!bulkTargetStatus || selectedIds.size === 0) return;
    setBulkSaving(true);
    setBulkError("");
    try {
      const res = await fetch("/api/debug-portal/tickets/bulk-status", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selectedIds],
          status: bulkTargetStatus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Bulk update failed");
      }
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBulkSaving(false);
    }
  }

  const bulkButtonLabel = bulkTargetStatus
    ? `Move to ${TICKET_STATUS_LABELS[bulkTargetStatus]}`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description="Review debug captures from TBOS and tickets you filed here."
      />

      <div className="dp-card p-4 sm:p-5">
        <p className="mb-4 text-sm font-medium text-slate-800">{countLabel}</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterField label="Reporter" htmlFor="reporter-filter" className="sm:max-w-[18rem]">
            <ChevronSelect
              id="reporter-filter"
              value={reporterFilter}
              onChange={onReporterChange}
              className="block w-full min-w-0"
              aria-label="Filter by reporter"
            >
              <option value="">All reporters</option>
              {reporterOptions.map((r) => (
                <option key={r.reporterUserId} value={r.reporterUserId}>
                  {r.reporterEmail}
                </option>
              ))}
            </ChevronSelect>
          </FilterField>
          <FilterField label="Status" htmlFor="status-filter">
            <ChevronSelect
              id="status-filter"
              value={statusFilter}
              onChange={setStatusFilter}
              className="block w-full min-w-0"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TICKET_STATUS_LABELS[s]}
                </option>
              ))}
            </ChevronSelect>
          </FilterField>
        </div>
        {showBulkActions && rows.length > 0 && !loading ? (
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Bulk update visible {TICKET_STATUS_LABELS[filteredStatus!].toLowerCase()} tickets
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={toggleSelectAll} className="dp-btn-ghost py-2 text-sm">
                {allVisibleSelected ? "Clear selection" : "Select all on page"}
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0 || bulkSaving}
                onClick={() => void bulkAdvanceSelected()}
                className="dp-btn-primary py-2"
              >
                {bulkSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {bulkButtonLabel}
                {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {bulkError ? (
              <p className="w-full text-sm text-red-700" role="alert">
                {bulkError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="dp-card flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" aria-label="Loading" />
        </div>
      ) : rows.length === 0 ? (
        <div className="dp-card px-6 py-12 text-center">
          <p className="text-sm text-slate-600">No tickets to show.</p>
          <Link href="/tickets/new" className="dp-btn-primary mt-4 inline-flex">
            <Plus className="h-4 w-4" />
            Create your first ticket
          </Link>
        </div>
      ) : (
        <div className="dp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50/90">
                <tr>
                  {showBulkActions ? (
                    <th className="dp-table-head w-10">
                      <span className="sr-only">Select</span>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                        }}
                        onChange={toggleSelectAll}
                        aria-label={allVisibleSelected ? "Deselect all tickets" : "Select all tickets on page"}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </th>
                  ) : null}
                  <th className="dp-table-head">Ticket</th>
                  <th className="dp-table-head">Status</th>
                  <th className="dp-table-head">Type</th>
                  <th className="dp-table-head">Environment</th>
                  <th className="dp-table-head hidden lg:table-cell">Reporter</th>
                  <th className="dp-table-head">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50/80">
                    {showBulkActions ? (
                      <td className="dp-table-cell w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select ${row.ticketId}`}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                    ) : null}
                    <td className="dp-table-cell max-w-xs">
                      <Link
                        href={`/tickets/${row.id}`}
                        className="font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                      >
                        {row.ticketId}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {row.userDescription}
                      </p>
                    </td>
                    <td className="dp-table-cell">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}
                      >
                        {TICKET_STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="dp-table-cell">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${typeBadgeClass(row.type)}`}
                      >
                        {formatTicketType(row.type)}
                      </span>
                    </td>
                    <td className="dp-table-cell whitespace-nowrap">
                      {formatEnvironment(row.reportedEnvironment)}
                    </td>
                    <td className="dp-table-cell hidden max-w-[10rem] truncate text-slate-600 lg:table-cell">
                      {row.reporterEmail}
                    </td>
                    <td className="dp-table-cell whitespace-nowrap text-slate-600">
                      {new Date(row.createdAt).toLocaleString("en-AU", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketsListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
        </div>
      }
    >
      <TicketsListInner />
    </Suspense>
  );
}
