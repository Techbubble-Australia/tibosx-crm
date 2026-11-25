"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type Opp = {
  id: string;
  name: string;
  clientName: string;
  currency: string;
  amount: number;
  probability: number | null;
  stageName: string;
  stageType: string | null;
  active: boolean;
  nextStepDue: string | null;
  ownerName: string;
};

function money(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

export default function OpportunitiesForecastPage() {
  const [rows, setRows] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminFetch("/api/admin/opportunities?active=true")
      .then((res) => res.json())
      .then((data) => setRows((data.data ?? []) as Opp[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const open = useMemo(
    () => rows.filter((r) => r.active && r.stageType !== "won" && r.stageType !== "lost"),
    [rows],
  );

  const totals = useMemo(() => {
    const pipeline = open.reduce((s, r) => s + r.amount, 0);
    const weighted = open.reduce((s, r) => s + r.amount * ((r.probability ?? 0) / 100), 0);
    return { pipeline, weighted, count: open.length };
  }, [open]);

  const byStage = useMemo(() => {
    const map = new Map<string, { name: string; count: number; amount: number; weighted: number }>();
    for (const r of open) {
      const key = r.stageName || "Unstaged";
      const cur = map.get(key) ?? { name: key, count: 0, amount: 0, weighted: 0 };
      cur.count += 1;
      cur.amount += r.amount;
      cur.weighted += r.amount * ((r.probability ?? 0) / 100);
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [open]);

  const currency = open[0]?.currency || "AUD";

  return (
    <ClientsOnlyGuard>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Opportunities</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totals.count} open · {money(currency, totals.pipeline)} · weighted{" "}
              {money(currency, totals.weighted)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings/crm/import-export?entity=opportunities"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium dark:border-gray-600 dark:bg-gray-900"
            >
              <Upload className="h-4 w-4" />
              Import
            </Link>
            <Link
              href="/opportunities/new"
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              <Plus className="h-4 w-4" />
              Opportunity
            </Link>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading forecast…</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Open pipeline", value: money(currency, totals.pipeline) },
                { label: "Weighted forecast", value: money(currency, totals.weighted) },
                { label: "Open deals", value: String(totals.count) },
              ].map((k) => (
                <div key={k.label} className="border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{k.label}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{k.value}</p>
                </div>
              ))}
            </div>

            <section className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">By stage</h3>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2">Stage</th>
                    <th className="px-4 py-2">Deals</th>
                    <th className="px-4 py-2">Pipeline</th>
                    <th className="px-4 py-2">Weighted</th>
                  </tr>
                </thead>
                <tbody>
                  {byStage.map((s) => (
                    <tr key={s.name} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                      <td className="px-4 py-2 tabular-nums">{s.count}</td>
                      <td className="px-4 py-2 tabular-nums">{money(currency, s.amount)}</td>
                      <td className="px-4 py-2 tabular-nums">{money(currency, s.weighted)}</td>
                    </tr>
                  ))}
                  {!byStage.length ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No open opportunities.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>

            <section className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Open deals</h3>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2">Opportunity</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Stage</th>
                    <th className="px-4 py-2">Value</th>
                    <th className="px-4 py-2">Weighted</th>
                    <th className="px-4 py-2">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {open.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-2">
                        <Link href={`/opportunities/${r.id}`} className="font-medium text-blue-600 hover:underline">
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{r.clientName}</td>
                      <td className="px-4 py-2">{r.stageName || "—"}</td>
                      <td className="px-4 py-2 tabular-nums">{money(r.currency, r.amount)}</td>
                      <td className="px-4 py-2 tabular-nums">
                        {money(r.currency, r.amount * ((r.probability ?? 0) / 100))}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{r.ownerName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
