"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

const MODULE_KEYS = ["sales_crm", "recruitment", "customer_support", "projects"] as const;

type TenantMe = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  isPlatformAdmin: boolean;
  modules: Record<string, boolean>;
};

export default function CrmWorkspacePage() {
  const [tenant, setTenant] = useState<TenantMe | null>(null);
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    void adminFetch("/api/admin/crm/tenants/me")
      .then((res) => res.json())
      .then((data) => {
        const me = data.data as TenantMe;
        setTenant(me);
        setModules({ ...me.modules });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!tenant?.tenantId) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/crm/tenants/${tenant.tenantId}/modules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      setModules(data.data ?? modules);
      appAlert("Modules updated.");
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ClientsOnlyGuard>
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workspace & modules</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enable or disable modules for the current tenant.
          </p>
        </div>

        {loading || !tenant ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tenant.tenantName}</p>
              <p className="text-xs text-gray-500">
                {tenant.tenantSlug} · {tenant.tenantId}
              </p>
            </div>
            <ul className="space-y-3">
              {MODULE_KEYS.map((key) => (
                <li key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm capitalize text-gray-800 dark:text-gray-200">
                    {key.replace(/_/g, " ")}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(modules[key])}
                    onChange={(e) => setModules((m) => ({ ...m, [key]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {saving ? "Saving…" : "Save modules"}
            </button>
          </section>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
