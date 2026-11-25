"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { formatCrmMoney } from "@/lib/crm-format";
import { OpportunitiesShell } from "@/components/opportunities/OpportunitiesShell";

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
  ownerName: string;
};

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

  const currency = open[0]?.currency || "AUD";

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

  const summary = `${totals.count} open · ${formatCrmMoney(totals.pipeline, currency)} · weighted ${formatCrmMoney(totals.weighted, currency)}`;

  return (
    <OpportunitiesShell summary={summary}>
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Open pipeline", value: formatCrmMoney(totals.pipeline, currency) },
              { label: "Weighted forecast", value: formatCrmMoney(totals.weighted, currency) },
              { label: "Open deals", value: String(totals.count) },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{k.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{k.value}</p>
              </div>
            ))}
          </div>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">By stage</h3>
            </div>
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Stage</th>
                  <th className="px-4 py-2 font-medium">Deals</th>
                  <th className="px-4 py-2 font-medium">Pipeline</th>
                  <th className="px-4 py-2 font-medium">Weighted</th>
                </tr>
              </thead>
              <tbody>
                {byStage.map((s) => (
                  <tr key={s.name} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                    <td className="px-4 py-2.5 tabular-nums">{s.count}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatCrmMoney(s.amount, currency)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatCrmMoney(s.weighted, currency)}</td>
                  </tr>
                ))}
                {!byStage.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No open opportunities.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Open deals</h3>
            </div>
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Opportunity</th>
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium">Stage</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Weighted</th>
                  <th className="px-4 py-2 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {open.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/opportunities/${r.id}`}
                        className="font-medium text-gray-900 hover:underline dark:text-gray-100"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{r.clientName}</td>
                    <td className="px-4 py-2.5">{r.stageName || "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatCrmMoney(r.amount, r.currency)}</td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {formatCrmMoney(r.amount * ((r.probability ?? 0) / 100), r.currency)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{r.ownerName || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </OpportunitiesShell>
  );
}
