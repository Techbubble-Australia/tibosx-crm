"use client";

import { useCallback, useEffect, useState } from "react";

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export type Sprint = {
  id: string;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: SprintStatus;
  createdAt: string;
  ticketCount: number;
};

/** Selector values besides a sprint id. */
export const ALL_SPRINTS = "";
export const BACKLOG = "none";

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function sprintDateRange(sprint: Pick<Sprint, "startDate" | "endDate">): string {
  if (sprint.startDate && sprint.endDate) return `${formatShortDate(sprint.startDate)} – ${formatShortDate(sprint.endDate)}`;
  if (sprint.startDate) return `from ${formatShortDate(sprint.startDate)}`;
  if (sprint.endDate) return `until ${formatShortDate(sprint.endDate)}`;
  return "";
}

export function sprintOptionLabel(sprint: Sprint): string {
  const range = sprintDateRange(sprint);
  const status = sprint.status === "ACTIVE" ? "" : ` · ${SPRINT_STATUS_LABELS[sprint.status]}`;
  return `${sprint.name}${range ? ` (${range})` : ""}${status}`;
}

function sprintRecency(sprint: Sprint): string {
  return sprint.startDate ?? sprint.createdAt;
}

/** Newest sprint by start date (or creation date when it has none). */
export function latestSprint(sprints: Sprint[]): Sprint | null {
  return sprints.reduce<Sprint | null>(
    (latest, s) => (!latest || sprintRecency(s) > sprintRecency(latest) ? s : latest),
    null,
  );
}

/** Default selection: the active sprint, else the latest sprint, else all tickets. */
export function defaultSprintSelection(sprints: Sprint[]): string {
  return (sprints.find((s) => s.status === "ACTIVE") ?? latestSprint(sprints))?.id ?? ALL_SPRINTS;
}

/** Strict confirmation for deleting a sprint (the API also requires the exact name). */
export function sprintDeleteConfirm(sprint: Sprint) {
  const n = sprint.ticketCount;
  return {
    title: `Permanently delete "${sprint.name}"?`,
    message:
      `This cannot be undone. The sprint's name, dates and goal are lost` +
      (n
        ? `, and its ${n} ticket${n === 1 ? "" : "s"} move back to the Backlog (each ticket's activity log records the move).`
        : ". It has no tickets."),
    confirmLabel: "Delete sprint permanently",
    tone: "danger" as const,
    requireText: sprint.name,
  };
}

export const ACTIVE_SPRINT_DELETE_HINT =
  "The active sprint can't be deleted. Set another sprint as active or mark this one Completed first.";

/** Completed sprints are read-only for non-admins. */
export function isSprintLocked(sprintStatus: string | null | undefined, isAdmin: boolean): boolean {
  return !isAdmin && sprintStatus === "COMPLETED";
}

export function useSprints() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/debug-portal/sprints", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json?.data)) setSprints(json.data as Sprint[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { sprints, loading, reload };
}
