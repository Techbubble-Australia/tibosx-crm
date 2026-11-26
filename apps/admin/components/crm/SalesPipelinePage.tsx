"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { formatCrmShortDate } from "@/lib/crm-format";

type Stage = { id: string; name: string; winProbability: number; order: number; stageType: string };
type BoardOpp = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  ownerName: string;
  nextStep?: string | null;
  nextStepDue?: string | null;
  probability?: number | null;
};
type BoardData = {
  pipeline: { id: string; stages: Stage[] } | null;
  columns: Array<{ stage: Stage; opportunities: BoardOpp[] }>;
};

function ownerShort(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${(parts[parts.length - 1]![0] ?? "").toUpperCase()}.`;
}

/** TIBOSX CRM Screens – 6 Sales pipeline */
export function SalesPipelinePage() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [stats, setStats] = useState<{
    openPipelineAmount: number;
    openOpportunityCount: number;
    weightedForecast: number;
    winRateLast90Days: number | null;
  } | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [owner, setOwner] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    void Promise.all([
      adminFetch("/api/admin/opportunities/board").then((r) => r.json()),
      adminFetch("/api/admin/sales-dashboard/stats").then((r) => r.json()),
    ])
      .then(([boardBody, statsBody]) => {
        setBoard((boardBody.data ?? null) as BoardData | null);
        const k = statsBody.data?.kpis ?? statsBody.kpis ?? {};
        setStats({
          openPipelineAmount: k.openPipelineAmount ?? 0,
          openOpportunityCount: k.openOpportunityCount ?? 0,
          weightedForecast: k.weightedForecast ?? 0,
          winRateLast90Days: k.winRateLast90Days ?? null,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const owners = useMemo(() => {
    const names = new Set<string>();
    for (const col of board?.columns ?? []) {
      for (const o of col.opportunities) if (o.ownerName) names.add(o.ownerName);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [board]);

  const columns = useMemo(() => {
    return (board?.columns ?? []).map((col) => ({
      ...col,
      opportunities: col.opportunities.filter((o) => !owner || o.ownerName === owner),
    }));
  }, [board, owner]);

  return (
    <ClientsOnlyGuard>
      <div className="space-y-5">
        <CrmPageHeader
          title="Sales"
          subtitle="Deals, quotes and forecast"
          actions={
            <>
              <CrmGhostButton href="/settings/crm/import-export?entity=opportunities">Export</CrmGhostButton>
              <CrmPrimaryButton href="/opportunities/new">
                <Plus className="h-4 w-4" /> Deal
              </CrmPrimaryButton>
            </>
          }
        />

        <CrmSegmentTabs
          activeId="pipeline"
          tabs={[
            { id: "pipeline", label: "Pipeline", href: "/sales/dashboard" },
            { id: "quotes", label: "Quotes", href: "/quotes" },
          ]}
        />

        <div className="flex flex-wrap gap-3.5">
          <CrmKpiCard
            label="Pipeline value"
            value={moneyUsdStyle(stats?.openPipelineAmount ?? 0)}
            sub={`${stats?.openOpportunityCount ?? 0} deals`}
          />
          <CrmKpiCard
            label="Weighted forecast"
            value={moneyUsdStyle(stats?.weightedForecast ?? 0)}
            sub="this quarter"
          />
          <CrmKpiCard
            label="Win rate"
            value={stats?.winRateLast90Days != null ? `${Math.round(stats.winRateLast90Days)}%` : "—"}
            sub="last 90 days"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Sales pipeline</h2>
          <div className="flex flex-wrap items-center gap-2">
            <CrmFilterSelect value={owner} onChange={setOwner} aria-label="Owner">
              <option value="">All owners</option>
              {owners.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </CrmFilterSelect>
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-gray-900">
              {(["board", "list"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                    view === id
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && !board ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
          </div>
        ) : view === "list" ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500 dark:border-zinc-800">
                  <th className="px-4 py-3 font-medium">Deal</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {columns.flatMap((col) =>
                  col.opportunities.map((opp) => (
                    <tr key={opp.id} className="border-b border-zinc-50 last:border-0 dark:border-zinc-800">
                      <td className="px-4 py-3">
                        <Link href={`/opportunities/${opp.id}`} className="font-medium hover:underline">
                          {opp.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{col.stage.name}</td>
                      <td className="px-4 py-3 text-zinc-500">{ownerShort(opp.ownerName || "—")}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{moneyUsdStyle(opp.amount)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {columns.map((col) => (
              <div key={col.stage.id} className="flex w-[15.5rem] shrink-0 flex-col">
                <div className="mb-2 flex items-baseline justify-between px-0.5">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{col.stage.name}</h3>
                  <span className="text-xs text-zinc-500">{col.opportunities.length}</span>
                </div>
                <div className="flex min-h-[12rem] flex-1 flex-col gap-2 rounded-xl bg-[#eceef1] p-2 dark:bg-zinc-950/50">
                  {col.opportunities.map((opp) => (
                    <article
                      key={opp.id}
                      className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-gray-900"
                    >
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="block text-[13px] font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {opp.name}
                      </Link>
                      <p className="mt-1 text-[15px] font-semibold tabular-nums">{moneyUsdStyle(opp.amount)}</p>
                      <p className="mt-1 text-xs text-zinc-500">{ownerShort(opp.ownerName || "Unassigned")}</p>
                      <p className="mt-2 text-[11px] text-zinc-500">
                        Next:{" "}
                        {opp.nextStep?.trim()
                          ? `${opp.nextStep}${formatCrmShortDate(opp.nextStepDue) ? `, ${formatCrmShortDate(opp.nextStepDue)}` : ""}`
                          : "—"}
                      </p>
                    </article>
                  ))}
                  {!col.opportunities.length ? (
                    <p className="px-1 py-8 text-center text-xs text-zinc-400">Empty</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
