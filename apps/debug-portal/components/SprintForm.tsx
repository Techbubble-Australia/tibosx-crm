"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import type { Sprint, SprintStatus } from "@/lib/sprints";

type SprintDraft = { name: string; goal: string; startDate: string; endDate: string; status: SprintStatus };

function initialDraft(sprint: Sprint | null, activeSprint: Sprint | null): SprintDraft {
  if (sprint) {
    return {
      name: sprint.name,
      goal: sprint.goal ?? "",
      startDate: sprint.startDate?.slice(0, 10) ?? "",
      endDate: sprint.endDate?.slice(0, 10) ?? "",
      status: sprint.status,
    };
  }
  return { name: "", goal: "", startDate: "", endDate: "", status: activeSprint ? "PLANNED" : "ACTIVE" };
}

type Props = {
  /** Sprint being edited; null creates a new one. */
  sprint: Sprint | null;
  activeSprint: Sprint | null;
  onSaved: (sprint: Sprint) => void | Promise<void>;
  onCancel: () => void;
};

export function SprintForm({ sprint, activeSprint, onSaved, onCancel }: Props) {
  const [draft, setDraft] = useState<SprintDraft>(() => initialDraft(sprint, activeSprint));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const completesActive =
    draft.status === "ACTIVE" && activeSprint !== null && activeSprint.id !== sprint?.id;

  async function save() {
    if (!draft.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/sprints${sprint ? `/${sprint.id}` : ""}`, {
        method: sprint ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          goal: draft.goal.trim() || null,
          startDate: draft.startDate || null,
          endDate: draft.endDate || null,
          status: draft.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not save sprint");
      await onSaved(data.data as Sprint);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save sprint");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{sprint ? `Edit ${sprint.name}` : "New sprint"}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="dp-label" htmlFor="sprint-name">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            id="sprint-name"
            value={draft.name}
            maxLength={80}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Sprint 12"
            className="dp-input"
            autoFocus
          />
        </div>
        <div>
          <label className="dp-label" htmlFor="sprint-start">
            Start date
          </label>
          <input
            id="sprint-start"
            type="date"
            value={draft.startDate}
            onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
            className="dp-input"
          />
        </div>
        <div>
          <label className="dp-label" htmlFor="sprint-end">
            End date
          </label>
          <input
            id="sprint-end"
            type="date"
            value={draft.endDate}
            min={draft.startDate || undefined}
            onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
            className="dp-input"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="dp-label" htmlFor="sprint-goal">
            Goal <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="sprint-goal"
            value={draft.goal}
            maxLength={2000}
            onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))}
            placeholder="What should this sprint deliver?"
            className="dp-input"
          />
        </div>
        <div>
          <label className="dp-label" htmlFor="sprint-status">
            Status
          </label>
          <ChevronSelect
            id="sprint-status"
            value={draft.status}
            onChange={(v) => setDraft((d) => ({ ...d, status: v as SprintStatus }))}
            className="block w-full min-w-0"
          >
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </ChevronSelect>
          {completesActive ? (
            <p className="mt-1 text-[11px] text-amber-700">{activeSprint.name} will be marked Completed.</p>
          ) : draft.status === "ACTIVE" ? (
            <p className="mt-1 text-[11px] text-slate-500">New tickets will be added to this sprint.</p>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <button type="button" disabled={saving || !draft.name.trim()} onClick={() => void save()} className="dp-btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
          {sprint ? "Save sprint" : "Create sprint"}
        </button>
        <button type="button" onClick={onCancel} className="dp-btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
