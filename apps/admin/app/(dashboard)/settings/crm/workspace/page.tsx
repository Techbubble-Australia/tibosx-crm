"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type TenantMe = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  region?: string;
  isPlatformAdmin: boolean;
  modules: Record<string, boolean>;
};

type WorkspaceFields = {
  name: string;
  subdomain: string;
  dataRegion: string;
  baseCurrency: string;
  fiscalYearStarts: string;
  tax: string;
};

type ModuleRow = {
  key: string | null;
  label: string;
  note: string;
  /** When null, toggle is disabled (add-on / not offered). */
  moduleKey: "sales_crm" | "projects" | "customer_support" | "recruitment" | null;
  includedIn?: "sales_crm";
};

const MODULE_ROWS: ModuleRow[] = [
  {
    key: "sales_crm",
    label: "Sales and CRM",
    note: "Leads, opportunities, quotes",
    moduleKey: "sales_crm",
  },
  {
    key: "contracts",
    label: "Contracts and invoices",
    note: "Included with Sales and CRM",
    moduleKey: null,
    includedIn: "sales_crm",
  },
  {
    key: "projects",
    label: "Projects and timesheets",
    note: "Included",
    moduleKey: "projects",
  },
  {
    key: "customer_support",
    label: "Customer support",
    note: "Included",
    moduleKey: "customer_support",
  },
  {
    key: "recruitment",
    label: "Recruitment",
    note: "Staffing tenants",
    moduleKey: "recruitment",
  },
  {
    key: "website_cms",
    label: "Website CMS",
    note: "Add-on",
    moduleKey: null,
  },
];

const INTEGRATIONS = [
  { system: "Xero", status: "Connected" as const, use: "Invoices and payments" },
  {
    system: "QuickBooks Online",
    status: "Not connected" as const,
    use: "Invoices and payments (US tenants)",
  },
  { system: "MYOB", status: "Not connected" as const, use: "Later" },
  { system: "Microsoft 365 mail", status: "Connected" as const, use: "Email logging" },
];

const statePill = "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function regionLabel(region?: string) {
  if (!region) return "Australia";
  const normalized = region.toLowerCase();
  if (normalized === "au" || normalized === "australia") return "Australia";
  if (normalized === "us" || normalized === "usa") return "United States";
  return region;
}

function regionValue(region?: string) {
  if (!region) return "au";
  const normalized = region.toLowerCase();
  if (normalized === "australia") return "au";
  if (normalized === "united states" || normalized === "usa") return "us";
  return region;
}

export default function CrmWorkspacePage() {
  const [tenant, setTenant] = useState<TenantMe | null>(null);
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [workspace, setWorkspace] = useState<WorkspaceFields>({
    name: "",
    subdomain: "",
    dataRegion: "au",
    baseCurrency: "AUD",
    fiscalYearStarts: "July",
    tax: "GST 10%",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    void Promise.all([
      adminFetch("/api/admin/crm/tenants/me").then((res) => res.json()),
      adminFetch("/api/admin/crm/tenants/me/settings").then((res) => res.json()),
    ])
      .then(([meRes, settingsRes]) => {
        const me = meRes.data as TenantMe;
        setTenant(me);
        setModules({ ...me.modules });
        const ws = (settingsRes.data?.workspace ?? {}) as Partial<WorkspaceFields>;
        setWorkspace({
          name: ws.name || me.tenantName || "",
          subdomain: ws.subdomain || me.tenantSlug || "",
          dataRegion: regionValue(ws.dataRegion || me.region),
          baseCurrency: ws.baseCurrency || "AUD",
          fiscalYearStarts: ws.fiscalYearStarts || "July",
          tax: ws.tax || "GST 10%",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function moduleOn(row: ModuleRow): boolean {
    if (row.key === "website_cms") return false;
    if (row.includedIn) return Boolean(modules[row.includedIn]);
    if (row.moduleKey) return Boolean(modules[row.moduleKey]);
    return false;
  }

  async function save() {
    if (!tenant?.tenantId) return;
    setSaving(true);
    try {
      const [modulesRes, settingsRes] = await Promise.all([
        adminFetch(`/api/admin/crm/tenants/${tenant.tenantId}/modules`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modules }),
        }),
        adminFetch("/api/admin/crm/tenants/me/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace }),
        }),
      ]);
      const modulesData = await modulesRes.json().catch(() => ({}));
      const settingsData = await settingsRes.json().catch(() => ({}));
      if (!modulesRes.ok) {
        throw new Error(typeof modulesData.error === "string" ? modulesData.error : "Save failed");
      }
      if (!settingsRes.ok) {
        throw new Error(
          typeof settingsData.error === "string" ? settingsData.error : "Workspace save failed",
        );
      }
      setModules(modulesData.data ?? modules);
      if (settingsData.data?.workspace) {
        setWorkspace((prev) => ({ ...prev, ...settingsData.data.workspace }));
      }
      appAlert("Workspace and modules saved.");
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ClientsOnlyGuard>
      <div className="max-w-6xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Workspace and modules
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Settings for the tenant you are working in.
            </p>
          </div>
          <button
            type="button"
            disabled={saving || loading || !tenant}
            onClick={() => void save()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {loading || !tenant ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Workspace</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
                  <input
                    value={workspace.name}
                    onChange={(e) => setWorkspace((w) => ({ ...w, name: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Subdomain</label>
                  <input
                    value={workspace.subdomain}
                    onChange={(e) => setWorkspace((w) => ({ ...w, subdomain: e.target.value }))}
                    className={inputClass}
                    placeholder={tenant.tenantSlug}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Display slug · {tenant.tenantSlug}.tibosx.ai
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Data region</label>
                  <select
                    value={workspace.dataRegion}
                    onChange={(e) => setWorkspace((w) => ({ ...w, dataRegion: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="au">Australia</option>
                    <option value="us">United States</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Base currency</label>
                  <select
                    value={workspace.baseCurrency}
                    onChange={(e) => setWorkspace((w) => ({ ...w, baseCurrency: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="AUD">AUD</option>
                    <option value="USD">USD</option>
                    <option value="NZD">NZD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Fiscal year starts
                  </label>
                  <select
                    value={workspace.fiscalYearStarts}
                    onChange={(e) =>
                      setWorkspace((w) => ({ ...w, fiscalYearStarts: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="January">January</option>
                    <option value="April">April</option>
                    <option value="July">July</option>
                    <option value="October">October</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Tax</label>
                  <input
                    value={workspace.tax}
                    onChange={(e) => setWorkspace((w) => ({ ...w, tax: e.target.value }))}
                    className={inputClass}
                    placeholder="GST 10%"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Modules</h3>
                <p className="text-xs text-gray-500">
                  Modules are switched on per tenant. Menus and roles follow.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="py-2 text-left font-medium text-gray-600">Module</th>
                      <th className="py-2 text-left font-medium text-gray-600">State</th>
                      <th className="py-2 text-left font-medium text-gray-600">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {MODULE_ROWS.map((row) => {
                      const on = moduleOn(row);
                      const disabled = row.moduleKey === null;
                      return (
                        <tr key={row.key}>
                          <td className="py-2.5 text-gray-900 dark:text-gray-100">{row.label}</td>
                          <td className="py-2.5">
                            {/* Website CMS (and other non-switchable rows) render as a static add-on pill. */}
                            {disabled ? (
                              <span
                                className={`${statePill} ${
                                  on
                                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {on ? "On" : "Off"}
                              </span>
                            ) : (
                              <button
                                type="button"
                                role="switch"
                                aria-checked={on}
                                title="Click to switch"
                                onClick={() => setModules((m) => ({ ...m, [row.moduleKey!]: !on }))}
                                className={`${statePill} ${
                                  on
                                    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {on ? "On" : "Off"}
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 text-sm text-gray-600 dark:text-gray-400">{row.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            </div>

            <section className="space-y-2 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Security and data
              </h3>
              <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  MFA required for all users
                </span>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Data hosted in {regionLabel(workspace.dataRegion)}
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  US region available
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Audit log: 24 months
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Every record carries a tenant ID. Queries are filtered by row-level security, so one
                tenant can never read another.
              </p>
            </section>

            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Integrations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th className="py-2 text-left font-medium text-gray-600">System</th>
                      <th className="py-2 text-left font-medium text-gray-600">Status</th>
                      <th className="py-2 text-left font-medium text-gray-600">Use</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {INTEGRATIONS.map((row) => (
                      <tr key={row.system}>
                        <td className="py-2.5 text-gray-900 dark:text-gray-100">{row.system}</td>
                        <td className="py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              row.status === "Connected"
                                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-sm text-gray-600 dark:text-gray-400">{row.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Privacy requests
              </h3>
              <p className="text-xs text-gray-500">
                Rights requests under US state laws and the Australian Privacy Principles
              </p>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    2 open
                  </span>
                  Access request from a US contact, due in 28 days
                </li>
                <li className="flex items-center gap-2">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    1 closed
                  </span>
                  Deletion request, completed 12 Nov
                </li>
              </ul>
            </section>
          </>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
