"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
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
  opportunity: { id: string; name: string } | null;
  createdAt: string;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export default function LeadsPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    source: "manual",
    country: "",
  });

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

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          company: form.company || null,
          title: form.title || null,
          source: form.source || "manual",
          country: form.country || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to create lead");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        title: "",
        source: "manual",
        country: "",
      });
      setShowForm(false);
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

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
    <ClientsOnlyGuard>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leads</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Capture and convert inbound leads into opportunities.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void syncSubmissions()}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              Sync website submissions
            </button>
            <Link
              href="/leads/new"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              New lead
            </Link>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              {showForm ? "Hide form" : "Quick add"}
            </button>
          </div>
        </div>

        {showForm ? (
          <form
            onSubmit={(e) => void createLead(e)}
            className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <input
              required
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className={inputClass}
            />
            <input
              required
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className={inputClass}
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Title / interest"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Source"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className={inputClass}
            />
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {saving ? "Saving…" : "Create lead"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-3">
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
                {s}
              </option>
            ))}
          </select>
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
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Opportunity</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No leads yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.company || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.email}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.source}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.opportunity ? (
                          <Link
                            href={`/opportunities/${row.opportunity.id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {row.opportunity.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.status !== "CONVERTED" ? (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
