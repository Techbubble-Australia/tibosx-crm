"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarRange, KanbanSquare, Loader2, Lock, Pencil, PlayCircle, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SprintForm } from "@/components/SprintForm";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  ACTIVE_SPRINT_DELETE_HINT,
  BACKLOG,
  SPRINT_STATUS_LABELS,
  isSprintLocked,
  sprintDateRange,
  sprintDeleteConfirm,
  useSprints,
  type Sprint,
} from "@/lib/sprints";
import { usePortalUser } from "@/lib/use-portal-user";

function statusBadgeClass(status: Sprint["status"]): string {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "PLANNED") return "dp-chip-active";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export default function SprintsPage() {
  const { isAdmin } = usePortalUser();
  const confirm = useConfirm();
  const { sprints, loading, reload } = useSprints();
  const [form, setForm] = useState<{ sprint: Sprint | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const activeSprint = sprints.find((s) => s.status === "ACTIVE") ?? null;

  async function request(sprint: Sprint, init: RequestInit, fallback: string) {
    setBusyId(sprint.id);
    setError("");
    try {
      const res = await fetch(`/api/debug-portal/sprints/${sprint.id}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : fallback);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusyId(null);
    }
  }

  async function activate(sprint: Sprint) {
    const ok = await confirm({
      title: `Make "${sprint.name}" the active sprint?`,
      message: activeSprint
        ? `"${activeSprint.name}" will be marked Completed. New tickets will go to "${sprint.name}".`
        : `New tickets will go to "${sprint.name}".`,
      confirmLabel: "Set as active",
    });
    if (!ok) return;
    void request(sprint, { method: "PATCH", body: JSON.stringify({ status: "ACTIVE" }) }, "Could not activate sprint");
  }

  async function remove(sprint: Sprint) {
    if (sprint.status === "ACTIVE") return;
    if (!(await confirm(sprintDeleteConfirm(sprint)))) return;
    void request(
      sprint,
      { method: "DELETE", body: JSON.stringify({ confirmName: sprint.name }) },
      "Could not delete sprint",
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sprints"
        description={
          activeSprint
            ? `New tickets are added to the active sprint, ${activeSprint.name}.`
            : "There is no active sprint, so new tickets are saved to the Backlog."
        }
      />

      {isAdmin ? (
        form ? (
          <SprintForm
            key={form.sprint?.id ?? "new"}
            sprint={form.sprint}
            activeSprint={activeSprint}
            onSaved={async () => {
              await reload();
              setForm(null);
            }}
            onCancel={() => setForm(null)}
          />
        ) : (
          <button type="button" onClick={() => setForm({ sprint: null })} className="dp-btn-primary">
            <Plus className="h-4 w-4" aria-hidden /> New sprint
          </button>
        )
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="dp-card flex h-40 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin dp-spinner" aria-label="Loading sprints" />
        </div>
      ) : (
        <div className="space-y-3">
          {sprints.map((sprint) => (
            <div key={sprint.id} className="dp-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-slate-900">{sprint.name}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(sprint.status)}`}>
                    {SPRINT_STATUS_LABELS[sprint.status]}
                  </span>
                  {isSprintLocked(sprint.status, isAdmin) ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Lock className="h-3.5 w-3.5" aria-hidden /> Read-only
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  {sprintDateRange(sprint) ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                      {sprintDateRange(sprint)}
                    </span>
                  ) : null}
                  <span>{sprint.ticketCount} ticket(s)</span>
                </div>
                {sprint.goal ? <p className="text-sm text-slate-600">{sprint.goal}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {busyId === sprint.id ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden /> : null}
                <Link href={`/board?sprint=${sprint.id}`} className="dp-btn-secondary py-2">
                  <KanbanSquare className="h-4 w-4" aria-hidden /> Open board
                </Link>
                {isAdmin ? (
                  <>
                    {sprint.status !== "ACTIVE" ? (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => void activate(sprint)}
                        className="dp-btn-secondary py-2 text-emerald-800"
                      >
                        <PlayCircle className="h-4 w-4" aria-hidden /> Set as active
                      </button>
                    ) : null}
                    <button type="button" onClick={() => setForm({ sprint })} className="dp-btn-secondary py-2">
                      <Pencil className="h-4 w-4" aria-hidden /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId !== null || sprint.status === "ACTIVE"}
                      title={sprint.status === "ACTIVE" ? ACTIVE_SPRINT_DELETE_HINT : undefined}
                      onClick={() => void remove(sprint)}
                      className="dp-btn-ghost py-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden /> Delete
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}

          <div className="dp-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Backlog</h2>
              <p className="text-xs text-slate-600">Tickets not in any sprint.</p>
            </div>
            <Link href={`/board?sprint=${BACKLOG}`} className="dp-btn-secondary py-2">
              <KanbanSquare className="h-4 w-4" aria-hidden /> Open board
            </Link>
          </div>

          {sprints.length === 0 ? (
            <p className="text-sm text-slate-600">
              No sprints yet.{isAdmin ? " Create one above; set it to Active to collect new tickets." : ""}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
