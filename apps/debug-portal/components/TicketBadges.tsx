"use client";

import { Bug, Layers, ListTree, Milestone, Sparkles, Target } from "lucide-react";
import { useTicketStatuses } from "@/components/TicketStatusesProvider";
import { formatTicketType, typeBadgeClass } from "@/lib/tickets";

type Size = "sm" | "md";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "gap-1 px-2 py-0.5 text-[11px]",
  md: "gap-1.5 px-2.5 py-0.5 text-xs",
};

/** Status pill in the column's configured colour, with a matching dot. */
export function StatusBadge({ status, size = "md" }: { status: string; size?: Size }) {
  const { labelOf, badgeClassOf, swatchClassOf } = useTicketStatuses();
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${SIZE_CLASSES[size]} ${badgeClassOf(status)}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${swatchClassOf(status)}`} aria-hidden />
      {labelOf(status)}
    </span>
  );
}

function TypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "INITIATIVE":
      return <Milestone className={className} aria-hidden />;
    case "EPIC":
      return <Layers className={className} aria-hidden />;
    case "STORY":
      return <Sparkles className={className} aria-hidden />;
    case "TASK":
      return <Target className={className} aria-hidden />;
    case "SUBTASK":
      return <ListTree className={className} aria-hidden />;
    default:
      return <Bug className={className} aria-hidden />;
  }
}

/** Issue-type badge with an icon matched to the hierarchy type. */
export function TypeBadge({ type, size = "md" }: { type: string; size?: Size }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md font-semibold ${SIZE_CLASSES[size]} ${typeBadgeClass(type)}`}
    >
      <TypeIcon type={type} className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {formatTicketType(type)}
    </span>
  );
}
