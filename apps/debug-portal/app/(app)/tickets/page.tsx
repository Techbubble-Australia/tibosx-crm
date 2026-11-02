"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  statusBadgeClass,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Debug capture tickets</h1>
          <p className="text-sm text-slate-600">
            {total} ticket{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="reporter-filter" className="text-sm text-slate-600">
              Reporter
            </label>
            <ChevronSelect
              id="reporter-filter"
              value={reporterFilter}
              onChange={onReporterChange}
              className="min-w-[12rem]"
              aria-label="Filter by reporter"
            >
              <option value="">All reporters</option>
              {reporterOptions.map((r) => (
                <option key={r.reporterUserId} value={r.reporterUserId}>
                  {r.reporterEmail}
                </option>
              ))}
            </ChevronSelect>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm text-slate-600">
              Status
            </label>
            <ChevronSelect
              id="status-filter"
              value={statusFilter}
              onChange={setStatusFilter}
              className="min-w-[9rem]"
              aria-label="Filter by status"
            >
              <option value="">All</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TICKET_STATUS_LABELS[s]}
                </option>
              ))}
            </ChevronSelect>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No tickets found.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Env</th>
                <th className="px-4 py-3 font-medium">Reporter</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${row.id}`} className="font-medium text-sky-700 hover:underline">
                      {row.ticketId}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-500">{row.userDescription}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                    >
                      {TICKET_STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3 capitalize">{row.reportedEnvironment}</td>
                  <td className="px-4 py-3 text-slate-600">{row.reporterEmail}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {new Date(row.createdAt).toLocaleString("en-AU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TicketsListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <TicketsListInner />
    </Suspense>
  );
}
