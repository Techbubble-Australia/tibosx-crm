"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import {
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
  clientName: string;
  amount: number;
  ownerName: string;
  nextStep?: string | null;
  nextStepDue?: string | null;
  probability?: number | null;
  updatedAt?: string | null;
  notes?: string | null;
};
type BoardData = {
  pipeline: { id: string; stages: Stage[] } | null;
  columns: Array<{ stage: Stage; opportunities: BoardOpp[] }>;
};

function ownerShort(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Unassigned";
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${(parts[parts.length - 1]![0] ?? "").toUpperCase()}.`;
}

function ageDays(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / 86400000));
}

/** TIBOSX CRM Screens – 20 Planning Pipeline board */
export function PlanningPipelinePage() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [stats, setStats] = useState<{
    pipelineValue: number;
    winRate: number | null;
    avgDeal: number;
    avgAge: number | null;
    activeDeals: number;
    wonAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    void Promise.all([
      adminFetch("/api/admin/opportunities/board").then((r) => r.json()),
      adminFetch("/api/admin/sales-dashboard/stats").then((r) => r.json()),
    ])
      .then(([boardBody, statsBody]) => {
        const data = (boardBody.data ?? null) as BoardData | null;
        setBoard(data);
        const k = statsBody.data?.kpis ?? statsBody.kpis ?? {};
        const opps = (data?.columns ?? []).flatMap((c) => c.opportunities);
        const active = opps.filter(Boolean);
        const avgDeal =
          active.length > 0 ? active.reduce((s, o) => s + (o.amount || 0), 0) / active.length : 0;
        const ages = active.map((o) => ageDays(o.updatedAt ?? o.nextStepDue)).filter((n): n is number => n != null);
        const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;
        setStats({
          pipelineValue: k.openPipelineAmount ?? active.reduce((s, o) => s + (o.amount || 0), 0),
          winRate: k.winRateLast90Days ?? null,
          avgDeal,
          avgAge,
          activeDeals: active.length,
          wonAmount: k.wonThisMonthAmount ?? 0,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(() => board?.columns ?? [], [board]);

  return (
    <ClientsOnlyGuard>
      <div className="space-y-5">
        <CrmPageHeader
          title="Planning"
          subtitle="Manage your deals, appointments and tasks"
          actions={
            <>
              <CrmGhostButton href="/opportunities/list">Contacts</CrmGhostButton>
              <CrmPrimaryButton href="/opportunities/new">
                <Plus className="h-4 w-4" /> New deal
              </CrmPrimaryButton>
            </>
          }
        />

        <CrmSegmentTabs
          activeId="deals"
          tabs={[
            { id: "deals", label: "Deals", href: "/opportunities" },
            { id: "appointments", label: "Appointments", href: "/opportunities?tab=appointments" },
            { id: "tasks", label: "Tasks", href: "/opportunities?tab=tasks" },
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sales overview</p>
            <p className="text-xs text-zinc-500">Analytics</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3.5">
          <CrmKpiCard
            label="Pipeline value"
            value={moneyUsdStyle(stats?.pipelineValue ?? 0)}
            sub="Weighted by probability"
          />
          <CrmKpiCard
            label="Win rate"
            value={stats?.winRate != null ? `${Math.round(stats.winRate)}%` : "—"}
            sub="closed deals"
          />
          <CrmKpiCard
            label="Avg. deal size"
            value={moneyUsdStyle(stats?.avgDeal ?? 0)}
            sub={`Won deals: ${moneyUsdStyle(stats?.wonAmount ?? 0)}`}
          />
          <CrmKpiCard
            label="Avg deal age"
            value={stats?.avgAge != null ? `${stats.avgAge} days` : "—"}
            sub={`${stats?.activeDeals ?? 0} active deals`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <CrmSegmentTabs
            activeId="pipeline"
            tabs={[
              { id: "pipeline", label: "Pipeline", href: "/opportunities" },
              { id: "contacts", label: "Contacts", href: "/clients/active" },
            ]}
          />
          <CrmGhostButton href="/opportunities/list">Filters</CrmGhostButton>
        </div>

        {loading && !board ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {columns.map((col) => {
              const sum = col.opportunities.reduce((s, o) => s + (o.amount || 0), 0);
              return (
                <div key={col.stage.id} className="flex w-[17rem] shrink-0 flex-col">
                  <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{col.stage.name}</h3>
                    <span className="text-xs tabular-nums text-zinc-500">{moneyUsdStyle(sum)}</span>
                  </div>
                  <div className="flex min-h-[14rem] flex-1 flex-col gap-2 rounded-xl bg-[#eceef1] p-2 dark:bg-zinc-950/50">
                    {col.opportunities.map((opp) => {
                      const age = ageDays(opp.updatedAt ?? opp.nextStepDue);
                      const prob = opp.probability ?? col.stage.winProbability;
                      return (
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
                          <p className="mt-1 text-xs text-zinc-500">
                            {opp.clientName || "—"}
                            <br />
                            Assigned to {ownerShort(opp.ownerName || "Unassigned")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                            {age != null ? <span>⏱ {age} days</span> : null}
                            <span>% {prob}%</span>
                          </div>
                          {opp.nextStep?.trim() ? (
                            <p className="mt-2 text-[11px] leading-snug text-zinc-500">
                              Next: {opp.nextStep}
                              {formatCrmShortDate(opp.nextStepDue) ? `, ${formatCrmShortDate(opp.nextStepDue)}` : ""}
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                    {!col.opportunities.length ? (
                      <p className="px-1 py-8 text-center text-xs text-zinc-400">Empty</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
