"use client";

import { ChevronSelect } from "@/components/ChevronSelect";
import { useTicketStatuses } from "@/components/TicketStatusesProvider";
import type { BoardFamily, TicketStatus } from "@/lib/tickets";

type Props = {
  value: TicketStatus;
  onChange: (value: TicketStatus) => void;
  /** Which board family's columns to offer (defaults to WORK). */
  boardFamily?: BoardFamily;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function StatusSelect({
  value,
  onChange,
  boardFamily = "WORK",
  id,
  disabled,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const { statusesOf, labelOf } = useTicketStatuses();
  const statuses = statusesOf(boardFamily);
  const known = statuses.some((s) => s.key === value);
  return (
    <ChevronSelect
      id={id}
      value={value}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      onChange={(v) => onChange(v)}
    >
      {known ? null : <option value={value}>{labelOf(value)}</option>}
      {statuses.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </ChevronSelect>
  );
}
