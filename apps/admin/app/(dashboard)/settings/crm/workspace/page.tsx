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
  region?: string;
  isPlatformAdmin: boolean;
  modules: Record<string, boolean>;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function regionLabel(region?: string) {
  if (!region) return "—";
  const normalized = region.toLowerCase();
  if (normalized === "au" || normalized === "australia") return "Australia";
  if (normalized === "us" || normalized === "usa") return "United States";
  return region;
}

export default function CrmWorkspacePage() {
  const [tenant, setTenant] = useState<TenantMe | null>(null);
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaults] = useState({
    currency: "AUD",
    fiscalYearStart: "July",
    taxRate: "10%",
  });

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
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workspace and modules</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Settings for the tenant you are working in.
          </p>
        </div>

        {loading || !tenant ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <>
            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Workspace</h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{tenant.tenantName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Slug</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{tenant.tenantSlug}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Data region</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{regionLabel(tenant.region)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Tenant ID</dt>
                  <dd className="mt-1 truncate text-xs text-gray-500">{tenant.tenantId}</dd>
                </div>
              </dl>

              <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Workspace defaults
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Base currency</label>
                    <input readOnly value={defaults.currency} className={`${inputClass} opacity-80`} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Fiscal year starts</label>
                    <input readOnly value={defaults.fiscalYearStart} className={`${inputClass} opacity-80`} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Tax rate</label>
                    <input readOnly value={defaults.taxRate} className={`${inputClass} opacity-80`} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Currency AUD, FY start July, tax rate 10% — workspace defaults (read-only for now).
                </p>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Modules</h3>
                <p className="text-xs text-gray-500">Modules are switched on per tenant. Menus and roles follow.</p>
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
          </>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
