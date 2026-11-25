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
};

type Pipeline = {
  id: string;
  name: string;
  kind: string;
  isDefault: boolean;
  active: boolean;
  stages: Stage[];
};

const DEFAULT_STAGES = [
  { name: "Qualified", stageType: "open" as const, winProbability: 10, order: 0 },
  { name: "Discovery", stageType: "open" as const, winProbability: 25, order: 1 },
  { name: "Proposal", stageType: "open" as const, winProbability: 50, order: 2 },
  { name: "Verbal yes", stageType: "open" as const, winProbability: 80, order: 3 },
  { name: "Won", stageType: "won" as const, winProbability: 100, order: 4 },
  { name: "Lost", stageType: "lost" as const, winProbability: 0, order: 5 },
];

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export default function PipelinesSettingsPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("services");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    void adminFetch("/api/admin/crm/pipelines")
      .then((res) => res.json())
      .then((data) => setPipelines((data.data ?? []) as Pipeline[]))
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
      const res = await adminFetch("/api/admin/crm/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          kind,
          isDefault,
          stages: DEFAULT_STAGES,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to create pipeline");
      setName("");
      setIsDefault(false);
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to create pipeline");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pipelines</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Opportunity stages for your sales process.
          </p>
        </div>

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
            <input value={kind} onChange={(e) => setKind(e.target.value)} className={inputClass} />
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
            {saving ? "Creating…" : "Create with default stages"}
          </button>
        </form>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        ) : pipelines.length === 0 ? (
          <p className="text-sm text-gray-400">No pipelines yet.</p>
        ) : (
          <div className="space-y-4">
            {pipelines.map((pipeline) => (
              <section
                key={pipeline.id}
                className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{pipeline.name}</h3>
                    <p className="text-xs text-gray-500">
                      {pipeline.kind}
                      {pipeline.isDefault ? " · default" : ""}
                      {!pipeline.active ? " · inactive" : ""}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{pipeline.stages.length} stages</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Order</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Stage</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-600">Win %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {pipeline.stages.map((stage) => (
                        <tr key={stage.id}>
                          <td className="px-4 py-2 text-gray-500">{stage.order}</td>
                          <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{stage.name}</td>
                          <td className="px-4 py-2 text-gray-600">{stage.stageType}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-gray-600">
                            {stage.winProbability}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </ClientsOnlyGuard>
  );
}
