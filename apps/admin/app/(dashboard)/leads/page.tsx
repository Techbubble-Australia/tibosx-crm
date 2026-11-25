"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, RefreshCw, Upload } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import { titleCaseToken } from "@/lib/crm-format";

const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "NURTURING",
  "UNQUALIFIED",
  "CONVERTED",
  "DISQUALIFIED",
] as const;

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

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CONTACTED: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  QUALIFIED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  NURTURING: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  CONVERTED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};
const STATUS_BADGE_FALLBACK = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

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

function ownerLabel(lead: Lead) {
  if (!lead.owner) return "Unassigned";
  return lead.owner.name?.trim() || lead.owner.email || "Unassigned";
}

function LeadsPageInner() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight")?.trim() ?? "";
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(() => searchParams.get("q")?.trim() ?? "");
  const [status, setStatus] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Keep the search box in sync when ?q= changes (e.g. global search navigation).
  const qParam = searchParams.get("q")?.trim() ?? "";
  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    void adminFetch(`/api/admin/crm/leads?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setRows((data.data ?? []) as Lead[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!highlightId || loading) return;
    document.getElementById(`lead-row-${highlightId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightId, loading, rows]);

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
                  opportunity: { id: opportunityId, name: "Converted opportunity" },
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

  async function syncSubmissions() {
    setSyncing(true);
    try {
      const res = await adminFetch("/api/admin/crm/leads/sync-contact-submissions", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Sync failed");
      appAlert(`Synced: ${data.data?.created ?? 0} new lead(s) from ${data.data?.scanned ?? 0} submissions.`);
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leads</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Website contact submissions land here automatically
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/settings/crm/import-export?entity=leads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
          <Link
            href="/leads/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            Lead
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, company…"
          className={`${inputClass} max-w-xs`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} max-w-[200px]`}>
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {titleCaseToken(s)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void syncSubmissions()}
          disabled={syncing}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          Sync website submissions
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Lead</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Source</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Created</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Owner</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Convert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No leads yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const highlighted = highlightId === row.id;
                  const statusKey = row.status.toUpperCase();
                  return (
                    <tr
                      key={row.id}
                      id={`lead-row-${row.id}`}
                      className={highlighted ? "bg-amber-50 dark:bg-amber-900/20" : undefined}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {row.company?.trim() || `${row.firstName} ${row.lastName}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {row.company?.trim() ? `${row.firstName} ${row.lastName}` : row.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{titleCaseToken(row.source) || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_BADGE[statusKey] ?? STATUS_BADGE_FALLBACK
                          }`}
                        >
                          {titleCaseToken(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatCreated(row.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{ownerLabel(row)}</td>
                      <td className="px-4 py-3 text-right">
                        {statusKey !== "CONVERTED" ? (
                          <button
                            type="button"
                            disabled={convertingId === row.id}
                            onClick={() => void convertLead(row.id)}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
                          >
                            {convertingId === row.id ? "Converting…" : "Convert"}
                          </button>
                        ) : row.opportunity ? (
                          <Link
                            href={`/opportunities/${row.opportunity.id}`}
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            View opportunity
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/60">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Convert in one click</p>
        <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
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
