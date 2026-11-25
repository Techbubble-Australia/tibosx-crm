"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

type Stage = {
  id: string;
  name: string;
  stageType: string;
  winProbability: number;
  order: number;
  requiredFields?: string[] | null;
};

type Pipeline = {
  id: string;
  name: string;
  kind: string;
  isDefault: boolean;
  active: boolean;
  stages: Stage[];
};

const SERVICES_STAGES = [
  {
    name: "Qualify",
    stageType: "open" as const,
    winProbability: 10,
    order: 0,
    requiredFields: ["Source", "owner"],
  },
  {
    name: "Scope",
    stageType: "open" as const,
    winProbability: 25,
    order: 1,
    requiredFields: ["Engagement model", "next step"],
  },
  {
    name: "Proposal",
    stageType: "open" as const,
    winProbability: 50,
    order: 2,
    requiredFields: ["Value", "close date", "quote"],
  },
  {
    name: "Negotiate",
    stageType: "open" as const,
    winProbability: 75,
    order: 3,
    requiredFields: ["Decision maker"],
  },
  {
    name: "Verbal yes",
    stageType: "open" as const,
    winProbability: 90,
    order: 4,
    requiredFields: ["Contract terms"],
  },
  {
    name: "Won",
    stageType: "won" as const,
    winProbability: 100,
    order: 5,
    requiredFields: ["Creates contract draft"],
  },
  {
    name: "Lost",
    stageType: "lost" as const,
    winProbability: 0,
    order: 6,
    requiredFields: ["Lost reason"],
  },
];

const STAFFING_STAGES = [
  {
    name: "Requirement received",
    stageType: "open" as const,
    winProbability: 10,
    order: 0,
    requiredFields: ["Role", "location"],
  },
  {
    name: "Candidates sourced",
    stageType: "open" as const,
    winProbability: 25,
    order: 1,
    requiredFields: ["Linked job listing"],
  },
  {
    name: "Submitted to client",
    stageType: "open" as const,
    winProbability: 40,
    order: 2,
    requiredFields: ["1 candidate"],
  },
  {
    name: "Interview",
    stageType: "open" as const,
    winProbability: 60,
    order: 3,
    requiredFields: ["Interview date"],
  },
  {
    name: "Offer",
    stageType: "open" as const,
    winProbability: 85,
    order: 4,
    requiredFields: ["Rate agreed"],
  },
  {
    name: "Placed",
    stageType: "won" as const,
    winProbability: 100,
    order: 5,
    requiredFields: ["Creates contract and project"],
  },
];

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function requiredFieldsNote(fields: Stage["requiredFields"]) {
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return "—";
  }
  return fields.join(", ");
}

export default function PipelinesSettingsPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("Services pipeline");
  const [kind, setKind] = useState("services");
  const [isDefault, setIsDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingStaffing, setCreatingStaffing] = useState(false);
  const [stageDrafts, setStageDrafts] = useState<
    Record<string, { name: string; stageType: string; winProbability: number; order: number }>
  >({});
  const [savingStageId, setSavingStageId] = useState<string | null>(null);
  const [addingPipelineId, setAddingPipelineId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    void adminFetch("/api/admin/crm/pipelines")
      .then((res) => res.json())
      .then((data) => {
        const rows = (data.data ?? []) as Pipeline[];
        setPipelines(rows);
        const drafts: typeof stageDrafts = {};
        for (const pipeline of rows) {
          drafts[pipeline.id] = {
            name: "",
            stageType: "open",
            winProbability: 50,
            order: pipeline.stages.length,
          };
        }
        setStageDrafts(drafts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createPipeline(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const stages = kind === "staffing" ? STAFFING_STAGES : SERVICES_STAGES;
      const res = await adminFetch("/api/admin/crm/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || (kind === "staffing" ? "Staffing pipeline" : "Services pipeline"),
          kind,
          isDefault,
          stages,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to create pipeline");
      setName("Services pipeline");
      setKind("services");
      setIsDefault(true);
      setShowCreate(false);
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to create pipeline");
    } finally {
      setSaving(false);
    }
  }

  async function createStaffingPipeline() {
    setCreatingStaffing(true);
    try {
      const res = await adminFetch("/api/admin/crm/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Staffing pipeline",
          kind: "staffing",
          isDefault: false,
          stages: STAFFING_STAGES,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to create staffing pipeline");
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to create staffing pipeline");
    } finally {
      setCreatingStaffing(false);
    }
  }

  async function updateWinProbability(stage: Stage, value: number) {
    setSavingStageId(stage.id);
    try {
      const res = await adminFetch(`/api/admin/crm/pipelines/stages/${stage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winProbability: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to update stage");
      setPipelines((prev) =>
        prev.map((pipeline) => ({
          ...pipeline,
          stages: pipeline.stages.map((s) =>
            s.id === stage.id ? { ...s, winProbability: data.data?.winProbability ?? value } : s,
          ),
        })),
      );
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to update stage");
    } finally {
      setSavingStageId(null);
    }
  }

  async function addStage(pipelineId: string) {
    const draft = stageDrafts[pipelineId];
    if (!draft?.name.trim()) {
      appAlert("Stage name is required.");
      return;
    }
    setAddingPipelineId(pipelineId);
    try {
      const res = await adminFetch(`/api/admin/crm/pipelines/${pipelineId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          stageType: draft.stageType,
          winProbability: draft.winProbability,
          order: draft.order,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to add stage");
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to add stage");
    } finally {
      setAddingPipelineId(null);
    }
  }

  const hasStaffing = pipelines.some(
    (p) => p.kind === "staffing" || /staffing/i.test(p.name),
  );

  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Pipelines and stages
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Per workspace. Each pipeline has its own stages, probabilities and required fields.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!hasStaffing ? (
              <button
                type="button"
                disabled={creatingStaffing}
                onClick={() => void createStaffingPipeline()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                {creatingStaffing ? "Creating…" : "Add staffing pipeline"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setName("Services pipeline");
                setKind("services");
                setIsDefault(pipelines.length === 0);
                setShowCreate((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              <Plus className="h-4 w-4" />
              Pipeline
            </button>
          </div>
        </div>

        {showCreate ? (
          <form
            onSubmit={(e) => void createPipeline(e)}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Services pipeline"
                className={inputClass}
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-gray-600">Kind</label>
              <select
                value={kind}
                onChange={(e) => {
                  const next = e.target.value;
                  setKind(next);
                  if (next === "staffing") {
                    setName("Staffing pipeline");
                    setIsDefault(false);
                  } else {
                    setName("Services pipeline");
                  }
                }}
                className={inputClass}
              >
                <option value="services">services</option>
                <option value="staffing">staffing</option>
              </select>
            </div>
            <label className="mb-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              Default
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Creating…" : "Create"}
            </button>
          </form>
        ) : null}

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : pipelines.length === 0 ? (
          <p className="text-sm text-gray-400">
            No pipelines yet. Create a Services pipeline (default) to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {pipelines.map((pipeline) => (
              <section
                key={pipeline.id}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {pipeline.name}
                      {pipeline.isDefault ? (
                        <span className="ml-2 text-xs font-normal text-gray-500">(default)</span>
                      ) : null}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {pipeline.kind}
                      {!pipeline.active ? " · inactive" : ""}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{pipeline.stages.length} stages</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Stage</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Probability</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Required to enter
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {pipeline.stages.map((stage) => (
                        <tr key={stage.id}>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{stage.name}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={stage.winProbability}
                                disabled={savingStageId === stage.id}
                                onChange={(e) => {
                                  const next = Number.parseInt(e.target.value, 10);
                                  if (Number.isNaN(next)) return;
                                  setPipelines((prev) =>
                                    prev.map((p) =>
                                      p.id !== pipeline.id
                                        ? p
                                        : {
                                            ...p,
                                            stages: p.stages.map((s) =>
                                              s.id === stage.id
                                                ? { ...s, winProbability: next }
                                                : s,
                                            ),
                                          },
                                    ),
                                  );
                                }}
                                onBlur={(e) => {
                                  const next = Number.parseInt(e.target.value, 10);
                                  if (Number.isNaN(next)) return;
                                  void updateWinProbability(stage, Math.min(100, Math.max(0, next)));
                                }}
                                className="w-16 rounded border border-gray-200 bg-white px-2 py-1 text-right tabular-nums dark:border-gray-600 dark:bg-gray-800"
                              />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">
                            {requiredFieldsNote(stage.requiredFields)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                  <div className="min-w-[140px] flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-600">New stage</label>
                    <input
                      value={stageDrafts[pipeline.id]?.name ?? ""}
                      onChange={(e) =>
                        setStageDrafts((d) => ({
                          ...d,
                          [pipeline.id]: {
                            ...(d[pipeline.id] ?? {
                              name: "",
                              stageType: "open",
                              winProbability: 50,
                              order: pipeline.stages.length,
                            }),
                            name: e.target.value,
                          },
                        }))
                      }
                      placeholder="Stage name"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
                    <select
                      value={stageDrafts[pipeline.id]?.stageType ?? "open"}
                      onChange={(e) =>
                        setStageDrafts((d) => ({
                          ...d,
                          [pipeline.id]: {
                            ...(d[pipeline.id] ?? {
                              name: "",
                              stageType: "open",
                              winProbability: 50,
                              order: pipeline.stages.length,
                            }),
                            stageType: e.target.value,
                          },
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="open">open</option>
                      <option value="won">won</option>
                      <option value="lost">lost</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Win %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={stageDrafts[pipeline.id]?.winProbability ?? 50}
                      onChange={(e) =>
                        setStageDrafts((d) => ({
                          ...d,
                          [pipeline.id]: {
                            ...(d[pipeline.id] ?? {
                              name: "",
                              stageType: "open",
                              winProbability: 50,
                              order: pipeline.stages.length,
                            }),
                            winProbability: Number.parseInt(e.target.value, 10) || 0,
                          },
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={addingPipelineId === pipeline.id}
                    onClick={() => void addStage(pipeline.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {addingPipelineId === pipeline.id ? "Adding…" : "Add stage"}
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
