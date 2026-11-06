"use client";

import { ChevronSelect } from "@/components/ChevronSelect";
import { useTicketStatuses } from "@/components/TicketStatusesProvider";
import type { TicketStatus } from "@/lib/tickets";

type Props = {
  value: TicketStatus;
  onChange: (value: TicketStatus) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function StatusSelect({ value, onChange, id, disabled, className, "aria-label": ariaLabel }: Props) {
  const { statuses, labelOf } = useTicketStatuses();
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
