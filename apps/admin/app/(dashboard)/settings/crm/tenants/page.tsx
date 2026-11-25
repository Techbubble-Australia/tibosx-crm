"use client";

import { useCallback, useEffect, useState } from "react";
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
  modules: Record<string, boolean>;
  memberCount: number;
  clientCount: number;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export default function TenantsPage() {
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", region: "au" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function viewAs(tenantId: string) {
    try {
      const res = await adminFetch(`/api/admin/crm/tenants/${tenantId}/view-as`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: 60, reason: "Admin view-as from CRM settings" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "View-as failed");
      appAlert(`View-as session started until ${new Date(data.data.expiresAt).toLocaleString()}.`);
      window.location.reload();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "View-as failed");
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
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tenants</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Platform admin: create tenants, view-as, and toggle modules.
          </p>
        </div>

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
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-gray-600">Region</label>
            <input
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" />
            {saving ? "Creating…" : "Create tenant"}
          </button>
        </form>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const open = expandedId === row.id;
              return (
                <section
                  key={row.id}
                  className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{row.name}</p>
                      <p className="text-xs text-gray-500">
                        {row.slug} · {row.region} · {row.memberCount} members · {row.clientCount} clients
                        {!row.active ? " · inactive" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(open ? null : row.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600"
                      >
                        {open ? "Hide modules" : "Modules"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void viewAs(row.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600"
                      >
                        View as
                      </button>
                    </div>
                  </div>
                  {open ? (
                    <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                      <ul className="mb-3 space-y-2">
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
                                  prev.map((r) => (r.id === row.id ? { ...r, modules: next } : r)),
                                );
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => void saveModules(row, row.modules)}
                        className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
                      >
                        Save modules
                      </button>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
