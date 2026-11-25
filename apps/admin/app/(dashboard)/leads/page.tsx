"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import { titleCaseToken } from "@/lib/crm-format";

type Lead = {
  id: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  title: string | null;
  source: string;
  country: string | null;
  ownerId?: string | null;
  owner?: { id: string; name: string | null; email: string } | null;
  opportunity: { id: string; name: string } | null;
  createdAt: string;
};

/** Wireframe status pills */
const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  CONTACTED: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  QUALIFIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  NURTURING: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  CONVERTED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  UNQUALIFIED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  DISQUALIFIED: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};
const STATUS_BADGE_FALLBACK = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

const STATUS_FILTER_OPTIONS = [
  { value: "open", label: "open" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "NURTURING", label: "Nurturing" },
  { value: "CONVERTED", label: "Converted" },
  { value: "UNQUALIFIED", label: "Unqualified" },
  { value: "DISQUALIFIED", label: "Disqualified" },
  { value: "", label: "all" },
] as const;

function formatCreated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return `Today ${date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function sourceLabel(source: string | null | undefined) {
  const s = (source ?? "").trim().toLowerCase();
  if (!s || s === "manual") return "Manual";
  if (s === "website" || s === "web" || s === "website_form" || s === "contact_form") {
    return "Website form";
  }
  if (s === "referral") return "Referral";
  if (s === "event") return "Event";
  if (s === "careers" || s === "careers_page") return "Careers page";
  return titleCaseToken(source);
}

function ownerLabel(lead: Lead) {
  if (!lead.owner) return "Unassigned";
  return lead.owner.name?.trim() || lead.owner.email || "Unassigned";
}

const filterSelectClass =
  "rounded-md border border-gray-200 bg-white py-1.5 pl-2.5 pr-8 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";

function LeadsPageInner() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight")?.trim() ?? "";
  const qParam = searchParams.get("q")?.trim() ?? "";

  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("open");
  const [source, setSource] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (qParam) params.set("q", qParam);
    if (status) params.set("status", status);
    if (source) params.set("source", source);
    if (ownerId) params.set("ownerId", ownerId);
    void adminFetch(`/api/admin/crm/leads?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data ?? []) as Lead[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [qParam, status, source, ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!highlightId || loading) return;
    document.getElementById(`lead-row-${highlightId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightId, loading, rows]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (row.source?.trim()) set.add(row.source.trim());
    }
    // Always offer common wireframe sources even if empty list.
    for (const s of ["website", "referral", "event", "careers_page", "manual"]) set.add(s);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const ownerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.owner?.id) {
        map.set(row.owner.id, row.owner.name?.trim() || row.owner.email);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  async function convertLead(id: string) {
    setConvertingId(id);
    try {
      const res = await adminFetch(`/api/admin/crm/leads/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createClient: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Convert failed");
      const opportunityId = data.data?.opportunityId as string | undefined;
      if (opportunityId) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "CONVERTED",
                  opportunity: { id: opportunityId, name: r.company || `${r.firstName} ${r.lastName}` },
                }
              : r,
          ),
        );
      }
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Convert failed");
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Website contact submissions land here automatically
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/settings/crm/import-export?entity=leads"
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Import
          </Link>
          <Link
            href="/leads/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            Lead
          </Link>
        </div>
      </div>

      {/* Wireframe filter row: Status / Source / Owner */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={filterSelectClass}
            aria-label="Status"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Source:</span>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={filterSelectClass}
            aria-label="Source"
          >
            <option value="">all</option>
            {sourceOptions.map((s) => (
              <option key={s} value={s}>
                {sourceLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Owner:</span>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className={filterSelectClass}
            aria-label="Owner"
          >
            <option value="">all</option>
            <option value="unassigned">Unassigned</option>
            {ownerOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {qParam ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Searching “{qParam}”
            <Link href="/leads" className="ml-2 underline hover:text-gray-800 dark:hover:text-gray-200">
              Clear
            </Link>
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Convert</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      No leads match these filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const highlighted = highlightId === row.id;
                    const statusKey = row.status.toUpperCase();
                    const person = `${row.firstName} ${row.lastName}`.trim();
                    return (
                      <tr
                        key={row.id}
                        id={`lead-row-${row.id}`}
                        className={`border-b border-gray-100 last:border-0 dark:border-gray-800 ${
                          highlighted ? "bg-amber-50 dark:bg-amber-900/20" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {row.company?.trim() || person}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {row.company?.trim() ? person : row.email}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">
                          {sourceLabel(row.source)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              STATUS_BADGE[statusKey] ?? STATUS_BADGE_FALLBACK
                            }`}
                          >
                            {titleCaseToken(row.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">
                          {formatCreated(row.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">{ownerLabel(row)}</td>
                        <td className="px-4 py-3.5 text-right">
                          {statusKey !== "CONVERTED" ? (
                            <button
                              type="button"
                              disabled={convertingId === row.id}
                              onClick={() => void convertLead(row.id)}
                              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-800"
                            >
                              {convertingId === row.id ? "…" : "Convert"}
                            </button>
                          ) : row.opportunity ? (
                            <Link
                              href={`/opportunities/${row.opportunity.id}`}
                              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                              View opportunity
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-400">Converted</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Convert in one click</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Convert creates the client (or links an existing one by domain and name check), a contact and an
          opportunity in the first stage of the chosen pipeline, and carries the lead&apos;s notes across.
        </p>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <ClientsOnlyGuard>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        }
      >
        <LeadsPageInner />
      </Suspense>
    </ClientsOnlyGuard>
  );
}
