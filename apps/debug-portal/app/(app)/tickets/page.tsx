"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { FilterField } from "@/components/ui/FilterField";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
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
