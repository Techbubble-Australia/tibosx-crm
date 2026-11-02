"use client";

import { ChevronSelect } from "@/components/ChevronSelect";
import { TICKET_STATUSES, TICKET_STATUS_LABELS, type TicketStatus } from "@/lib/tickets";

type Props = {
  value: TicketStatus;
  onChange: (value: TicketStatus) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function StatusSelect({ value, onChange, id, disabled, className, "aria-label": ariaLabel }: Props) {
  return (
    <ChevronSelect
      id={id}
      value={value}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      onChange={(v) => onChange(v as TicketStatus)}
    >
      {TICKET_STATUSES.map((s) => (
        <option key={s} value={s}>
          {TICKET_STATUS_LABELS[s]}
        </option>
      ))}
    </ChevronSelect>
  );
}
