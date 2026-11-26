"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import {
  CrmFilterSelect,
  CrmGhostButton,
  CrmKpiCard,
  CrmPageHeader,
  CrmPrimaryButton,
  CrmSegmentTabs,
  moneyUsdStyle,
} from "@/components/crm/CrmPageChrome";

type ClientRow = {
  id: string;
  name: string;
  country?: string | null;
  status: string;
  opportunityCount?: number;
  opportunityAmount?: number;
  ownerName?: string | null;
  lastContactAt?: string | null;
  balance?: number | null;
  industry?: string | null;
};

function relativeContact(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "bg-emerald-50 text-emerald-700";
  if (s === "AT_RISK" || s.includes("RISK")) return "bg-amber-50 text-amber-800";
  if (s === "OVERDUE" || s === "INACTIVE") return "bg-rose-50 text-rose-700";
  return "bg-zinc-100 text-zinc-700";
}

/** TIBOSX CRM Screens – 3 Clients */
export function ClientsCrmPage() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState({
    active: 0,
    revenue: 0,
    openDeals: 0,
    openAmount: 0,
    outstanding: 0,
    overdueCount: 0,
  });

  useEffect(() => {
    setLoading(true);
    void Promise.all([
      adminFetch("/api/admin/clients?status=ACTIVE").then((r) => r.json()),
      adminFetch("/api/admin/sales-dashboard/stats").then((r) => r.json()).catch(() => ({})),
      adminFetch("/api/admin/invoices?due=overdue&limit=50").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([clientsBody, statsBody, invBody]) => {
        const clients = (clientsBody.data ?? []) as ClientRow[];
        setRows(clients);
        const k = statsBody.data?.kpis ?? statsBody.kpis ?? {};
        const invoices = (invBody.data ?? []) as Array<{ totalAmount?: number; amount?: number }>;
        const outstanding = invoices.reduce((s, i) => s + Number(i.totalAmount ?? i.amount ?? 0), 0);
        setStats({
          active: clients.length,
          revenue: k.actualRevenueThisMonth ?? k.wonThisMonthAmount ?? 0,
          openDeals: k.openOpportunityCount ?? 0,
          openAmount: k.openPipelineAmount ?? 0,
          outstanding,
          overdueCount: invoices.length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const owners = useMemo(() => {
    const names = new Set<string>();
    for (const r of rows) if (r.ownerName) names.add(r.ownerName);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (owner && r.ownerName !== owner) return false;
    if (status && r.status.toUpperCase() !== status.toUpperCase()) return false;
    return true;
  });

  return (
    <ClientsOnlyGuard>
      <div className="space-y-5">
        <CrmPageHeader
          title="Clients"
          subtitle="Manage your client relationships and track performance"
          actions={
            <>
              <CrmGhostButton href="/settings/crm/import-export?entity=clients">Export</CrmGhostButton>
              <CrmPrimaryButton href="/clients/new">
                <Plus className="h-4 w-4" /> Add client
              </CrmPrimaryButton>
            </>
          }
        />

        <CrmSegmentTabs
          activeId="clients"
          tabs={[
            { id: "clients", label: "Clients", href: "/clients/active" },
            { id: "onboarding", label: "Onboarding", href: "/clients/prospect" },
          ]}
        />

        <div className="flex flex-wrap gap-3.5">
          <CrmKpiCard label="Active clients" value={String(stats.active)} sub="+ this month" />
          <CrmKpiCard label="Monthly revenue" value={moneyUsdStyle(stats.revenue)} sub="won / billed" />
          <CrmKpiCard
            label="Open deals"
            value={String(stats.openDeals)}
            sub={moneyUsdStyle(stats.openAmount)}
          />
          <CrmKpiCard
            label="Outstanding balance"
            value={moneyUsdStyle(stats.outstanding)}
            sub={`${stats.overdueCount} overdue`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CrmFilterSelect value={owner} onChange={setOwner} aria-label="Owner">
            <option value="">All owners</option>
            {owners.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </CrmFilterSelect>
          <CrmFilterSelect value={status} onChange={setStatus} aria-label="Status">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PROSPECT">Prospect</option>
          </CrmFilterSelect>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-gray-900">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500 dark:border-zinc-800">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Open deals</th>
                  <th className="px-4 py-3 font-medium">Last contact</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${row.id}`} className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100">
                        {row.name}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {[row.industry, row.country].filter(Boolean).join(", ") || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{row.ownerName || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {row.opportunityCount
                        ? `${row.opportunityCount}${row.opportunityAmount != null ? ` (${moneyUsdStyle(row.opportunityAmount)})` : ""}`
                        : "0"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{relativeContact(row.lastContactAt)}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700">
                      {moneyUsdStyle(row.balance ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(row.status)}`}>
                        {row.status === "ACTIVE" ? "Active" : row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-400">
                      No clients match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ClientsOnlyGuard>
  );
}
