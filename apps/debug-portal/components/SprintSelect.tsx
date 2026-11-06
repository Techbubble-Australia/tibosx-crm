"use client";

import { ChevronSelect } from "@/components/ChevronSelect";
import { ALL_SPRINTS, BACKLOG, sprintOptionLabel, type Sprint } from "@/lib/sprints";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  sprints: Sprint[];
  /** Show "All sprints" (filters only; not used when assigning a ticket). */
  includeAll?: boolean;
  /** Label completed sprints as read-only (non-admin view). */
  showLocks?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function SprintSelect({
  id,
  value,
  onChange,
  sprints,
  includeAll = false,
  showLocks = false,
  disabled,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const open = sprints.filter((s) => s.status !== "COMPLETED");
  const completed = sprints.filter((s) => s.status === "COMPLETED");
  return (
    <ChevronSelect
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel ?? "Sprint"}
    >
      {includeAll ? <option value={ALL_SPRINTS}>All sprints</option> : null}
      <option value={BACKLOG}>Backlog (no sprint)</option>
      {open.length ? (
        <optgroup label="Sprints">
          {open.map((s) => (
            <option key={s.id} value={s.id}>
              {sprintOptionLabel(s)}
            </option>
          ))}
        </optgroup>
      ) : null}
      {completed.length ? (
        <optgroup label={showLocks ? "Previous sprints (read-only)" : "Previous sprints"}>
          {completed.map((s) => (
            <option key={s.id} value={s.id}>
              {`${sprintOptionLabel(s)}${showLocks ? " · Locked" : ""}`}
            </option>
          ))}
        </optgroup>
      ) : null}
    </ChevronSelect>
  );
}
