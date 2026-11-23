"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { FilterField } from "@/components/ui/FilterField";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTicketStatuses } from "@/components/TicketStatusesProvider";
import { SprintSelect } from "@/components/SprintSelect";
import { StatusBadge, TypeBadge } from "@/components/TicketBadges";
import { TicketModal } from "@/components/TicketModal";
import { useAutoRefresh } from "@/lib/use-auto-refresh";
import { ALL_SPRINTS, defaultSprintSelection, useSprints } from "@/lib/sprints";
import {
  BOARD_LEVEL_TABS,
  DEBUG_ISSUE_TYPES,
  formatEnvironment,
  formatTicketType,
  nextStatusInOrder,
  type TicketStatus,
} from "@/lib/tickets";

type TicketRow = {
  id: string;
  ticketId: string;
  type: string;
  hierarchyLevel?: number;
  status: TicketStatus;
  reportedEnvironment: string;
  title?: string | null;
  userDescription: string;
  reporterEmail: string;
  createdAt: string;
  sprintId?: string | null;
  sprintName?: string | null;
};

type ReporterOption = {
  reporterUserId: string;
  reporterEmail: string;
};

/** URL marker so "All reporters" isn't mistaken for "no choice yet" (which defaults to the signed-in user). */
const ALL_REPORTERS = "all";
const PAGE_SIZE = 50;

function TicketsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [openTicket, setOpenTicket] = useState<TicketRow | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  /** null until sprints load and the default (active, else latest) sprint is chosen. */
  const [sprintFilter, setSprintFilter] = useState<string | null>(null);
  const { sprints, loading: sprintsLoading } = useSprints();

  useEffect(() => {
    if (sprintsLoading || sprintFilter !== null) return;
    setSprintFilter(defaultSprintSelection(sprints));
  }, [sprintsLoading, sprints, sprintFilter]);
  const [reporterFilter, setReporterFilter] = useState<string>("");
  const [reporters, setReporters] = useState<ReporterOption[]>([]);
  const [filtersReady, setFiltersReady] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState(0);

  const { statuses, labelOf } = useTicketStatuses();

  const filteredStatus = useMemo((): TicketStatus | null => {
    if (!statusFilter) return null;
    return statuses.some((s) => s.key === statusFilter) ? statusFilter : null;
  }, [statusFilter, statuses]);

  const bulkTargetStatus = useMemo(
    () => (filteredStatus ? nextStatusInOrder(statuses, filteredStatus) : null),
    [filteredStatus, statuses],
  );

  const showBulkActions = isAdmin && Boolean(bulkTargetStatus && filteredStatus);

  useEffect(() => {
    setSelectedIds(new Set());
    setBulkError("");
    setPage(0);
  }, [statusFilter, reporterFilter, sprintFilter, typeFilter, levelFilter]);

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
        const admin = Boolean(meJson?.data?.user?.isAdmin);
        setIsAdmin(admin);
        if (Array.isArray(repJson?.data)) {
          setReporters(repJson.data as ReporterOption[]);
        }

        const fromUrl = searchParams.get("reporterUserId")?.trim() ?? "";
        if (!admin) {
          // The API limits non-admins to their own tickets; no reporter filter to apply.
          setReporterFilter("");
        } else if (fromUrl === ALL_REPORTERS) {
          setReporterFilter("");
        } else if (fromUrl) {
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
      params.set("reporterUserId", value || ALL_REPORTERS);
      router.replace(`/tickets?${params.toString()}`);
    },
    [router, searchParams],
  );

  const loadSeq = useRef(0);
  /** `silent` refreshes in the background (auto-refresh) without the loading state. */
  const load = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!filtersReady || sprintFilter === null) return;
    // Silent refreshes must not bump loadSeq — otherwise they can strand a non-silent load with loading stuck true.
    const seq = silent ? loadSeq.current : ++loadSeq.current;
    if (!silent) setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      if (statusFilter) qs.set("status", statusFilter);
      if (reporterFilter) qs.set("reporterUserId", reporterFilter);
      if (sprintFilter) qs.set("sprintId", sprintFilter);
      if (typeFilter) qs.set("type", typeFilter);
      if (levelFilter !== "") qs.set("hierarchyLevel", levelFilter);
      const res = await fetch(`/api/debug-portal/tickets?${qs}`, { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (seq !== loadSeq.current) return;
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setRows(data.data ?? []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch {
      if (seq !== loadSeq.current || silent) return;
      setRows([]);
      setTotal(0);
    } finally {
      if (seq === loadSeq.current && !silent) setLoading(false);
    }
  }, [filtersReady, reporterFilter, statusFilter, sprintFilter, typeFilter, levelFilter, page]);

  useAutoRefresh(() => void load({ silent: true }), { paused: Boolean(openTicket || bulkSaving || loading) });

  useEffect(() => {
    void load();
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, (page + 1) * PAGE_SIZE);

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
          fromStatus: filteredStatus,
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
    ? `Move to ${labelOf(bulkTargetStatus)}`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description={
          isAdmin
            ? "Review debug captures from TBOS and tickets filed here."
            : "Tickets you reported from TBOS or filed here."
        }
      />

      <div className="dp-card p-4 sm:p-5">
        <p className="mb-4 text-sm font-medium text-slate-800">{countLabel}</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          {isAdmin ? (
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
          ) : null}
          <FilterField label="Status" htmlFor="status-filter">
            <ChevronSelect
              id="status-filter"
              value={statusFilter}
              onChange={setStatusFilter}
              className="block w-full min-w-0"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </ChevronSelect>
          </FilterField>
          <FilterField label="Type" htmlFor="type-filter">
            <ChevronSelect
              id="type-filter"
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                if (v) setLevelFilter("");
              }}
              className="block w-full min-w-0"
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              {DEBUG_ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {formatTicketType(t)}
                </option>
              ))}
            </ChevronSelect>
          </FilterField>
          <FilterField label="Level" htmlFor="level-filter">
            <ChevronSelect
              id="level-filter"
              value={levelFilter}
              onChange={(v) => {
                setLevelFilter(v);
                if (v !== "") setTypeFilter("");
              }}
              className="block w-full min-w-0"
              aria-label="Filter by hierarchy level"
            >
              <option value="">All levels</option>
              {BOARD_LEVEL_TABS.map((tab) => (
                <option key={tab.level} value={String(tab.level)}>
                  {tab.label}
                </option>
              ))}
            </ChevronSelect>
          </FilterField>
          <FilterField label="Sprint" htmlFor="sprint-filter" className="sm:max-w-[20rem]">
            <SprintSelect
              id="sprint-filter"
              value={sprintFilter ?? ALL_SPRINTS}
              onChange={setSprintFilter}
              sprints={sprints}
              includeAll
              showLocks={!isAdmin}
              disabled={sprintFilter === null}
              className="block w-full min-w-0"
            />
          </FilterField>
        </div>
        {showBulkActions && rows.length > 0 && !loading ? (
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Bulk update visible {labelOf(filteredStatus!).toLowerCase()} tickets
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
                      <button
                        type="button"
                        onClick={() => setOpenTicket(row)}
                        className="text-left font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                      >
                        {row.ticketId}
                      </button>
                      {row.title ? (
                        <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-900">{row.title}</p>
                      ) : null}
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {row.userDescription}
                      </p>
                    </td>
                    <td className="dp-table-cell">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="dp-table-cell">
                      <div className="flex flex-col items-start gap-1">
                        <TypeBadge type={row.type} />
                        {typeof row.hierarchyLevel === "number" ? (
                          <span className="text-[11px] text-slate-500">
                            {BOARD_LEVEL_TABS.find((t) => t.level === row.hierarchyLevel)?.label ??
                              `Level ${row.hierarchyLevel}`}
                          </span>
                        ) : null}
                      </div>
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
          {total > PAGE_SIZE ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
              <span>
                Showing {rangeStart}–{rangeEnd} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="dp-btn-secondary py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="tabular-nums">
                  Page {page + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="dp-btn-secondary py-1.5 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {openTicket ? (
        <TicketModal
          id={openTicket.id}
          ticketNumber={openTicket.ticketId}
          sprintId={openTicket.sprintId}
          sprintName={openTicket.sprintName}
          fullPageQuery="from=list"
          onClose={(changed) => {
            setOpenTicket(null);
            if (changed) void load();
          }}
        />
      ) : null}
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
