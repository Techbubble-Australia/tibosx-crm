"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { formatCrmMoney, formatCrmMoneyCompact, formatCrmShortDate, titleCaseToken } from "@/lib/crm-format";
import { OpportunitiesShell } from "@/components/opportunities/OpportunitiesShell";

type Stage = {
  id: string;
  name: string;
  stageType: string;
  winProbability: number;
  order: number;
};

type BoardOpp = {
  id: string;
  name: string;
  clientName: string;
  currency: string;
  amount: number;
  stageId: string | null;
  ownerId?: string | null;
  ownerName: string;
  nextStep?: string | null;
  nextStepDue?: string | null;
  engagementModel?: string | null;
  probability?: number | null;
};

type PipelineOption = { id: string; name: string; isDefault?: boolean };

type BoardData = {
  pipeline: { id: string; name: string; stages: Stage[] } | null;
  columns: Array<{ stage: Stage; opportunities: BoardOpp[] }>;
  unstaged: BoardOpp[];
};

const ENGAGEMENT_OPTIONS = [
  { value: "", label: "all" },
  { value: "T_AND_M", label: "T&M" },
  { value: "FIXED_PRICE", label: "Fixed price" },
  { value: "SUPPORT", label: "Support" },
  { value: "PLACEMENT", label: "Placement" },
];

function ownerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function engagementLabel(value: string | null | undefined) {
  if (!value) return null;
  const key = value.toUpperCase().replace(/\s+/g, "_");
  if (key === "T_AND_M" || key === "T&M") return "T&M";
  if (key === "FIXED_PRICE" || key === "FIXED") return "Fixed price";
  if (key === "SUPPORT") return "Support";
  if (key === "PLACEMENT") return "Placement";
  return titleCaseToken(value);
}

function normalizeEngagement(value: string | null | undefined) {
  return (value ?? "").toUpperCase().replace(/\s+/g, "_").replace("&", "_AND_");
}

function columnSum(opps: BoardOpp[]) {
  return opps.reduce((sum, o) => sum + (o.amount || 0), 0);
}

function isClosingThisMonth(opp: BoardOpp) {
  if (!opp.nextStepDue) return false;
  const d = new Date(opp.nextStepDue);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function FilterControl({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white pl-2.5 pr-1 text-sm dark:border-gray-600 dark:bg-gray-900">
      <span className="whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">{label}:</span>
      {children}
    </label>
  );
}

export function OpportunitiesBoard() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [summaryRows, setSummaryRows] = useState<
    Array<{ amount: number; currency: string; probability: number | null; active: boolean; stageType: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dragOppId, setDragOppId] = useState<string | null>(null);
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [pipelineId, setPipelineId] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [engagementFilter, setEngagementFilter] = useState("");
  const [savedView, setSavedView] = useState("closing");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (pipelineId) params.set("pipelineId", pipelineId);
    const qs = params.toString();
    void Promise.all([
      adminFetch(`/api/admin/opportunities/board${qs ? `?${qs}` : ""}`).then((res) => res.json()),
      adminFetch("/api/admin/opportunities?active=true").then((res) => res.json()),
    ])
      .then(([boardBody, listBody]) => {
        setBoard((boardBody.data ?? null) as BoardData | null);
        setSummaryRows((listBody.data ?? []) as typeof summaryRows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pipelineId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void adminFetch("/api/admin/crm/pipelines")
      .then((res) => res.json())
      .then((data) => setPipelines((data.data ?? []) as PipelineOption[]))
      .catch(console.error);
  }, []);

  const summary = useMemo(() => {
    const open = summaryRows.filter((r) => r.active && r.stageType !== "won" && r.stageType !== "lost");
    const pipeline = open.reduce((s, r) => s + r.amount, 0);
    const weighted = open.reduce((s, r) => s + r.amount * ((r.probability ?? 0) / 100), 0);
    const currency = open[0]?.currency || "AUD";
    return {
      count: open.length,
      pipeline,
      weighted,
      currency,
      label: `${open.length} open · ${formatCrmMoney(pipeline, currency)} · weighted ${formatCrmMoney(weighted, currency)}`,
    };
  }, [summaryRows]);

  const ownerOptions = useMemo(() => {
    const names = new Set<string>();
    for (const col of board?.columns ?? []) {
      for (const o of col.opportunities) if (o.ownerName) names.add(o.ownerName);
    }
    for (const o of board?.unstaged ?? []) if (o.ownerName) names.add(o.ownerName);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [board]);

  function matchesBase(o: BoardOpp) {
    if (ownerFilter === "__unassigned" && o.ownerName) return false;
    if (ownerFilter && ownerFilter !== "__unassigned" && o.ownerName !== ownerFilter) return false;
    if (engagementFilter && normalizeEngagement(o.engagementModel) !== normalizeEngagement(engagementFilter)) {
      return false;
    }
    return true;
  }

  function matchesFilters(o: BoardOpp) {
    if (!matchesBase(o)) return false;
    if (savedView === "closing") return isClosingThisMonth(o) || (o.probability ?? 0) >= 50;
    if (savedView === "no_next") return !o.nextStep?.trim();
    return true;
  }

  async function moveToStage(opportunityId: string, stageId: string) {
    setMovingId(opportunityId);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${opportunityId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Move failed");
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Move failed");
    } finally {
      setMovingId(null);
      setDragOppId(null);
    }
  }

  function renderCard(opp: BoardOpp, stageProb: number) {
    const hasNextStep = Boolean(opp.nextStep?.trim());
    const dueLabel = formatCrmShortDate(opp.nextStepDue);
    const prob = opp.probability ?? stageProb;
    const eng = engagementLabel(opp.engagementModel);

    return (
      <article
        key={opp.id}
        draggable={!movingId}
        onDragStart={() => setDragOppId(opp.id)}
        onDragEnd={() => setDragOppId(null)}
        className={`overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${
          dragOppId === opp.id ? "opacity-60" : ""
        }`}
      >
        <div className="px-3 pb-2.5 pt-3">
          <Link
            href={`/opportunities/${opp.id}`}
            className="block text-[13px] font-semibold leading-snug text-gray-950 hover:underline dark:text-gray-100"
          >
            {opp.name}
          </Link>
          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
            {opp.clientName || "—"}
            {eng ? ` · ${eng}` : ""}
          </p>
          {/* Value | % | avatar — one row, matching wireframe */}
          <div className="mt-2.5 grid grid-cols-3 items-center">
            <p className="text-[15px] font-semibold tabular-nums text-gray-950 dark:text-gray-100">
              {formatCrmMoney(opp.amount, opp.currency)}
            </p>
            <span className="text-center text-xs tabular-nums text-gray-500">{prob}%</span>
            <span className="flex justify-end">
              <span
                title={opp.ownerName || "Unassigned"}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {ownerInitials(opp.ownerName || "?")}
              </span>
            </span>
          </div>
        </div>
        <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-800">
          {hasNextStep ? (
            <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
              Next: {opp.nextStep}
              {dueLabel ? `, ${dueLabel}` : ""}
            </p>
          ) : (
            <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-300">
              No next step
            </span>
          )}
        </div>
      </article>
    );
  }

  const bareSelectClass =
    "max-w-[11rem] border-0 bg-transparent py-1.5 pl-0 pr-1 text-sm text-gray-800 focus:outline-none focus:ring-0 dark:text-gray-100";

  const filters = (
    <>
      <FilterControl label="Pipeline">
        <select
          value={pipelineId || board?.pipeline?.id || ""}
          onChange={(e) => setPipelineId(e.target.value)}
          className={bareSelectClass}
        >
          {(pipelines.length ? pipelines : board?.pipeline ? [board.pipeline] : []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name.replace(/\s*pipeline$/i, "") || p.name}
            </option>
          ))}
        </select>
      </FilterControl>
      <FilterControl label="Owner">
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={bareSelectClass}>
          <option value="">everyone</option>
          <option value="__unassigned">Unassigned</option>
          {ownerOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </FilterControl>
      <FilterControl label="Engagement model">
        <select
          value={engagementFilter}
          onChange={(e) => setEngagementFilter(e.target.value)}
          className={bareSelectClass}
        >
          {ENGAGEMENT_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FilterControl>
      <FilterControl label="Saved view">
        <select value={savedView} onChange={(e) => setSavedView(e.target.value)} className={bareSelectClass}>
          <option value="closing">Closing this month</option>
          <option value="all">All open</option>
          <option value="no_next">No next step</option>
        </select>
      </FilterControl>
    </>
  );

  if (loading && !board) {
    return (
      <OpportunitiesShell summary="Loading…" filters={filters}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      </OpportunitiesShell>
    );
  }

  if (!board?.pipeline) {
    return (
      <OpportunitiesShell summary={summary.label} filters={filters}>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
          No default pipeline configured. Create one under{" "}
          <Link href="/settings/crm/pipelines" className="text-blue-600 hover:underline">
            Settings → Pipelines and stages
          </Link>
          .
        </div>
      </OpportunitiesShell>
    );
  }

  let columns = [
    ...board.columns.map((c) => ({
      ...c,
      opportunities: c.opportunities.filter(matchesFilters),
    })),
  ];

  const anyVisible = columns.some((c) => c.opportunities.length > 0);
  if (!anyVisible && savedView === "closing") {
    columns = board.columns.map((c) => ({
      ...c,
      opportunities: c.opportunities.filter(matchesBase),
    }));
  }

  return (
    <OpportunitiesShell summary={summary.label} filters={filters}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => {
          const isDropTarget = true;
          const sum = columnSum(col.opportunities);
          const currency = col.opportunities[0]?.currency ?? summary.currency;
          return (
            <div
              key={col.stage.id}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragOppId) void moveToStage(dragOppId, col.stage.id);
              }}
              className="flex w-[16.5rem] shrink-0 flex-col"
            >
              <div className="mb-2 px-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-950 dark:text-gray-100">{col.stage.name}</h3>
                  <span className="text-xs tabular-nums text-gray-500">{col.stage.winProbability}%</span>
                </div>
                <p className="mt-0.5 text-xs tabular-nums text-gray-500">
                  {col.opportunities.length} · {formatCrmMoneyCompact(sum, currency)}
                </p>
              </div>
              <div
                className={`flex min-h-[14rem] flex-1 flex-col gap-2 rounded-xl bg-[#eceef1] p-2 dark:bg-gray-950/60 ${
                  dragOppId && isDropTarget ? "ring-2 ring-gray-300 dark:ring-gray-600" : ""
                }`}
              >
                {col.opportunities.length === 0 ? (
                  <p className="px-1 py-8 text-center text-xs text-gray-400">Empty</p>
                ) : (
                  col.opportunities.map((opp) => renderCard(opp, col.stage.winProbability))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </OpportunitiesShell>
  );
}
