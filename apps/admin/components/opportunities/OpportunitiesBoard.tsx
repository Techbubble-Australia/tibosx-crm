"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { formatCrmMoney, formatCrmShortDate, titleCaseToken } from "@/lib/crm-format";
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

const filterSelectClass =
  "rounded-md border border-gray-200 bg-white py-1.5 pl-2 pr-7 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";

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

function FilterLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}:</span>
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

  function matchesFilters(o: BoardOpp) {
    if (ownerFilter === "__unassigned" && o.ownerName) return false;
    if (ownerFilter && ownerFilter !== "__unassigned" && o.ownerName !== ownerFilter) return false;
    if (engagementFilter) {
      const eng = normalizeEngagement(o.engagementModel);
      if (eng !== normalizeEngagement(engagementFilter)) return false;
    }
    if (savedView === "closing" && !isClosingThisMonth(o) && (o.probability ?? 0) < 50) {
      // Wireframe default "Closing this month" — keep high-prob + due this month; if empty filter too aggressive, show all when none match later
    }
    if (savedView === "closing") {
      return isClosingThisMonth(o) || (o.probability ?? 0) >= 50;
    }
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
        className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 ${
          dragOppId === opp.id ? "opacity-60" : ""
        }`}
      >
        <div className="space-y-1.5 p-3">
          <Link
            href={`/opportunities/${opp.id}`}
            className="block text-sm font-semibold text-gray-900 hover:underline dark:text-gray-100"
          >
            {opp.name}
          </Link>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {opp.clientName || "—"}
            {eng ? ` · ${eng}` : ""}
          </p>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {formatCrmMoney(opp.amount, opp.currency)}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs tabular-nums text-gray-500">{prob}%</span>
              <span
                title={opp.ownerName || "Unassigned"}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {ownerInitials(opp.ownerName || "?")}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950/50">
          {hasNextStep ? (
            <p className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
              <Clock className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" aria-hidden />
              <span className="line-clamp-2">
                Next: {opp.nextStep}
                {dueLabel ? `, ${dueLabel}` : ""}
              </span>
            </p>
          ) : (
            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-200">
              No next step
            </span>
          )}
        </div>
      </article>
    );
  }

  const filters = (
    <>
      <FilterLabel label="Pipeline">
        <select
          value={pipelineId || board?.pipeline?.id || ""}
          onChange={(e) => setPipelineId(e.target.value)}
          className={filterSelectClass}
        >
          {(pipelines.length ? pipelines : board?.pipeline ? [board.pipeline] : []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </FilterLabel>
      <FilterLabel label="Owner">
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={filterSelectClass}>
          <option value="">everyone</option>
          <option value="__unassigned">Unassigned</option>
          {ownerOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </FilterLabel>
      <FilterLabel label="Engagement model">
        <select
          value={engagementFilter}
          onChange={(e) => setEngagementFilter(e.target.value)}
          className={filterSelectClass}
        >
          {ENGAGEMENT_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FilterLabel>
      <FilterLabel label="Saved view">
        <select value={savedView} onChange={(e) => setSavedView(e.target.value)} className={filterSelectClass}>
          <option value="all">All open</option>
          <option value="closing">Closing this month</option>
          <option value="no_next">No next step</option>
        </select>
      </FilterLabel>
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
    ...(board.unstaged.filter(matchesFilters).length
      ? [
          {
            stage: {
              id: "__unstaged",
              name: "Unstaged",
              stageType: "open",
              winProbability: 0,
              order: 999,
            } as Stage,
            opportunities: board.unstaged.filter(matchesFilters),
          },
        ]
      : []),
  ];

  // If "Closing this month" yields nothing, fall back to all filtered by owner/engagement so the board isn't empty.
  const anyVisible = columns.some((c) => c.opportunities.length > 0);
  if (!anyVisible && savedView === "closing") {
    columns = [
      ...board.columns.map((c) => ({
        ...c,
        opportunities: c.opportunities.filter((o) => {
          if (ownerFilter === "__unassigned" && o.ownerName) return false;
          if (ownerFilter && ownerFilter !== "__unassigned" && o.ownerName !== ownerFilter) return false;
          if (engagementFilter && normalizeEngagement(o.engagementModel) !== normalizeEngagement(engagementFilter)) {
            return false;
          }
          return true;
        }),
      })),
    ];
  }

  return (
    <OpportunitiesShell summary={summary.label} filters={filters}>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {columns.map((col) => {
          const isDropTarget = col.stage.id !== "__unstaged";
          const sum = columnSum(col.opportunities);
          const currency = col.opportunities[0]?.currency ?? summary.currency;
          return (
            <div
              key={col.stage.id}
              onDragOver={(e) => {
                if (isDropTarget) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragOppId && isDropTarget) void moveToStage(dragOppId, col.stage.id);
              }}
              className="flex w-[17.5rem] shrink-0 flex-col"
            >
              <div className="mb-2 px-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{col.stage.name}</h3>
                  {col.stage.id !== "__unstaged" ? (
                    <span className="text-xs tabular-nums text-gray-500">{col.stage.winProbability}%</span>
                  ) : null}
                </div>
                <p className="text-xs tabular-nums text-gray-500">
                  {col.opportunities.length} · {formatCrmMoney(sum, currency)}
                </p>
              </div>
              <div
                className={`flex min-h-[12rem] flex-1 flex-col gap-2 rounded-xl bg-gray-100/80 p-2 dark:bg-gray-950/50 ${
                  dragOppId && isDropTarget ? "ring-2 ring-gray-300 dark:ring-gray-600" : ""
                }`}
              >
                {col.opportunities.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-gray-400">Empty</p>
                ) : (
                  col.opportunities.map((opp) => renderCard(opp, col.stage.winProbability))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          What changed from the current Opportunities page
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
          <li>Single &quot;In progress&quot; status is replaced by stages with probability, so forecast is weighted.</li>
          <li>
            Free-text Comments is replaced by a mandatory next step and date; cards with none are flagged.
          </li>
          <li>
            &quot;Type: T&amp;M&quot; becomes Engagement model (T&amp;M, fixed price, support, placement).
          </li>
          <li>Active jobs becomes linked Recruitment roles on the detail page.</li>
          <li>Pipelines are configurable, so a staffing pipeline and a services pipeline can coexist.</li>
        </ul>
      </section>
    </OpportunitiesShell>
  );
}
