"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

const MODULE_KEYS = ["sales_crm", "recruitment", "customer_support", "projects"] as const;

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  region: string;
  active: boolean;
  plan: { id: string; name: string; slug: string } | null;
  modules: Record<string, boolean>;
  memberCount: number;
  clientCount: number;
  createdAt?: string;
};

/**
 * Tenants have no trial-end column yet. A tenant on a plan whose slug/name contains "trial"
 * is treated as trialing, with days left derived from createdAt + TRIAL_DAYS.
 */
const TRIAL_DAYS = 14;

function trialInfo(row: TenantRow): { daysLeft: number | null } | null {
  const isTrial = /trial/i.test(`${row.plan?.slug ?? ""} ${row.plan?.name ?? ""}`);
  if (!isTrial) return null;
  if (!row.createdAt) return { daysLeft: null };
  const end = new Date(row.createdAt).getTime() + TRIAL_DAYS * 86_400_000;
  return { daysLeft: Math.max(0, Math.ceil((end - Date.now()) / 86_400_000)) };
}

function statusInfo(row: TenantRow): { label: string; className: string } {
  if (!row.active) {
    return { label: "Suspended", className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  }
  const trial = trialInfo(row);
  if (trial) {
    return {
      label: trial.daysLeft == null ? "Trial" : `Trial, ${trial.daysLeft} days left`,
      className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
  }
  return { label: "Active", className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function modulesSummary(modules: Record<string, boolean>) {
  const labels: Record<string, string> = {
    sales_crm: "CRM",
    recruitment: "Recruitment",
    customer_support: "Support",
    projects: "Projects",
  };
  const enabled = MODULE_KEYS.filter((key) => modules[key]).map((key) => labels[key] ?? key);
  if (enabled.length === 0) return "None";
  if (enabled.length === MODULE_KEYS.length) return "All modules";
  return enabled.join(", ");
}

function regionLabel(region?: string) {
  if (!region) return "—";
  const normalized = region.toLowerCase();
  if (normalized === "au" || normalized === "australia") return "Australia";
  if (normalized === "us" || normalized === "usa") return "United States";
  return region;
}

export default function TenantsPage() {
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", region: "au" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewAsTarget, setViewAsTarget] = useState<TenantRow | null>(null);
  const [viewAsReason, setViewAsReason] = useState("");
  const [viewAsBusy, setViewAsBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    void adminFetch("/api/admin/crm/tenants")
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true);
          setRows([]);
          return;
        }
        const data = await res.json();
        setForbidden(false);
        setRows((data.data ?? []) as TenantRow[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(() => {
    const tenants = rows.length;
    const users = rows.reduce((sum, r) => sum + (r.memberCount ?? 0), 0);
    const onTrial = rows.filter((r) => r.active && trialInfo(r)).length;
    return {
      tenants,
      users,
      trialNote: `${onTrial} on trial`,
      mrrStub: "A$1,840",
    };
  }, [rows]);

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/crm/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          region: form.region.trim() || "au",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Create failed");
      setForm({ name: "", slug: "", region: "au" });
      setShowCreate(false);
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function submitViewAs(e: React.FormEvent) {
    e.preventDefault();
    if (!viewAsTarget) return;
    const reason = viewAsReason.trim();
    if (!reason) {
      appAlert("A reason is required for a view-as session.");
      return;
    }
    setViewAsBusy(true);
    try {
      const res = await adminFetch(`/api/admin/crm/tenants/${viewAsTarget.id}/view-as`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: 60, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "View-as failed");
      setViewAsTarget(null);
      setViewAsReason("");
      appAlert(`View-as session started until ${new Date(data.data.expiresAt).toLocaleString()}.`);
      window.location.reload();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "View-as failed");
    } finally {
      setViewAsBusy(false);
    }
  }

  async function saveModules(tenant: TenantRow, modules: Record<string, boolean>) {
    try {
      const res = await adminFetch(`/api/admin/crm/tenants/${tenant.id}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Update failed");
      setRows((prev) =>
        prev.map((r) => (r.id === tenant.id ? { ...r, modules: data.data ?? modules } : r)),
      );
      appAlert("Modules updated.");
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Update failed");
    }
  }

  if (forbidden) {
    return (
      <ClientsOnlyGuard>
        <p className="text-sm text-gray-500">Platform admin access required to manage tenants.</p>
      </ClientsOnlyGuard>
    );
  }

  return (
    <ClientsOnlyGuard>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tenants console</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Visible to TechBubble super admins only.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" />
            Tenant
          </button>
        </div>

        {!loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tenants</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {kpis.tenants}
              </p>
              <p className="text-xs text-gray-500">{kpis.trialNote}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Users</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {kpis.users}
              </p>
              <p className="text-xs text-gray-500">across tenants</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">MRR</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {kpis.mrrStub}
              </p>
              <p className="text-xs text-gray-500">sample</p>
            </div>
          </div>
        ) : null}

        {showCreate ? (
          <form
            onSubmit={(e) => void createTenant(e)}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">Slug</label>
              <input
                required
                pattern="^[a-z0-9-]+$"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-xs font-medium text-gray-600">Region</label>
              <select
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                className={inputClass}
              >
                <option value="au">Australia</option>
                <option value="us">United States</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </form>
        ) : null}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Tenant</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Users (staff + portal)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Modules</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Region</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No tenants yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const open = expandedId === row.id;
                      return (
                        <Fragment key={row.id}>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {row.name}
                              </div>
                              <div className="text-xs text-gray-500">{row.slug}.tibosx.ai</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {row.plan?.name ?? "—"}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-gray-600">
                              {/* "staff + portal" per wireframe, e.g. "28 + 12" */}
                              {row.clientCount > 0 ? `${row.memberCount} + ${row.clientCount}` : row.memberCount}
                            </td>
                            <td className="max-w-[200px] px-4 py-3 text-gray-600 dark:text-gray-400">
                              <span
                                className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                title={modulesSummary(row.modules)}
                              >
                                {modulesSummary(row.modules)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo(row).className}`}
                              >
                                {statusInfo(row).label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {regionLabel(row.region)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(open ? null : row.id)}
                                  className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600"
                                >
                                  {open ? "Hide" : "Modules"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewAsReason("");
                                    setViewAsTarget(row);
                                  }}
                                  className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600"
                                >
                                  View as
                                </button>
                              </div>
                            </td>
                          </tr>
                          {open ? (
                            <tr>
                              <td colSpan={7} className="bg-gray-50 px-4 py-3 dark:bg-gray-800/40">
                                <ul className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                  {MODULE_KEYS.map((key) => (
                                    <li key={key} className="flex items-center justify-between text-sm">
                                      <span className="capitalize text-gray-700 dark:text-gray-300">
                                        {key.replace(/_/g, " ")}
                                      </span>
                                      <input
                                        type="checkbox"
                                        checked={Boolean(row.modules[key])}
                                        onChange={(e) => {
                                          const next = { ...row.modules, [key]: e.target.checked };
                                          setRows((prev) =>
                                            prev.map((r) =>
                                              r.id === row.id ? { ...r, modules: next } : r,
                                            ),
                                          );
                                        }}
                                      />
                                    </li>
                                  ))}
                                </ul>
                                <p className="mb-2 text-xs text-gray-500">
                                  Website CMS is an add-on and is not offered in navigation.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => void saveModules(row, row.modules)}
                                  className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
                                >
                                  Save modules
                                </button>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewAsTarget ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={(e) => void submitViewAs(e)}
              className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                View as {viewAsTarget.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Needs a reason. The session is limited to 60 minutes and written to this tenant&apos;s
                audit log.
              </p>
              <label className="mt-4 block text-xs font-medium text-gray-600">Reason</label>
              <textarea
                required
                autoFocus
                rows={3}
                value={viewAsReason}
                onChange={(e) => setViewAsReason(e.target.value)}
                placeholder="e.g. Support ticket #1234 — investigate pipeline issue"
                className={inputClass}
              />
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setViewAsTarget(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium dark:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={viewAsBusy || !viewAsReason.trim()}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {viewAsBusy ? "Starting…" : "Start view-as"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Support access</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            A super admin can open a tenant in a view-as session. It needs a reason, is time-limited
            to 60 minutes, and is written to that tenant&apos;s audit log.
          </p>
        </section>
      </div>
    </ClientsOnlyGuard>
  );
}
