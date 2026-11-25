"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";

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
  ownerName: string;
  nextStep?: string | null;
  probability?: number | null;
};

type BoardData = {
  pipeline: { id: string; name: string; stages: Stage[] } | null;
  columns: Array<{ stage: Stage; opportunities: BoardOpp[] }>;
  unstaged: BoardOpp[];
};

function formatAmount(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

function ownerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function columnSum(opps: BoardOpp[]) {
  return opps.reduce((sum, o) => sum + (o.amount || 0), 0);
}

function columnCurrency(opps: BoardOpp[]) {
  return opps[0]?.currency ?? "AUD";
}

export function OpportunitiesBoard() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dragOppId, setDragOppId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    void adminFetch("/api/admin/opportunities/board")
      .then((res) => res.json())
      .then((data) => setBoard((data.data ?? null) as BoardData | null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allStages = board?.pipeline?.stages ?? board?.columns.map((c) => c.stage) ?? [];

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

  function renderCard(opp: BoardOpp) {
    const hasNextStep = Boolean(opp.nextStep?.trim());
    return (
      <article
        key={opp.id}
        draggable
        onDragStart={() => setDragOppId(opp.id)}
        onDragEnd={() => setDragOppId(null)}
        className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900 ${
          dragOppId === opp.id ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/opportunities/${opp.id}`}
            className="text-sm font-medium text-gray-900 hover:underline dark:text-gray-100"
          >
            {opp.name}
          </Link>
          <span
            title={opp.ownerName || "Unassigned"}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            {ownerInitials(opp.ownerName || "?")}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-500">{opp.clientName || "—"}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="text-xs tabular-nums text-gray-600 dark:text-gray-400">
            {formatAmount(opp.currency, opp.amount)}
          </p>
          {opp.probability != null ? (
            <span className="text-[11px] text-gray-500">{opp.probability}%</span>
          ) : null}
        </div>
        {hasNextStep ? (
          <p className="mt-1.5 line-clamp-2 text-[11px] text-gray-600 dark:text-gray-400">
            Next: {opp.nextStep}
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            No next step
          </p>
        )}
        <select
          disabled={movingId === opp.id}
          value={opp.stageId ?? ""}
          onChange={(e) => {
            const next = e.target.value;
            if (next) void moveToStage(opp.id, next);
          }}
          className="mt-2 w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="">Move to stage…</option>
          {allStages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </article>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  if (!board?.pipeline) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
        No default pipeline configured. Create one under{" "}
        <Link href="/settings/crm/pipelines" className="text-blue-600 hover:underline">
          CRM Settings → Pipelines
        </Link>
        .
      </div>
    );
  }

  const columns = [
    ...board.columns,
    ...(board.unstaged.length
      ? [
          {
            stage: {
              id: "__unstaged",
              name: "Unstaged",
              stageType: "open",
              winProbability: 0,
              order: 999,
            } as Stage,
            opportunities: board.unstaged,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Pipeline: <span className="font-medium text-gray-800 dark:text-gray-200">{board.pipeline.name}</span>
        {" · "}drag cards onto a column or use the stage dropdown.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => {
          const isDropTarget = col.stage.id !== "__unstaged";
          const sum = columnSum(col.opportunities);
          const currency = columnCurrency(col.opportunities);
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
              className="flex w-72 shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950/40"
            >
              <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{col.stage.name}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
                    {col.opportunities.length}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] tabular-nums text-gray-500">
                  {formatAmount(currency, sum)}
                  {col.stage.id !== "__unstaged" ? ` · ${col.stage.winProbability}%` : ""}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2">
                {col.opportunities.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-gray-400">Empty</p>
                ) : (
                  col.opportunities.map(renderCard)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
