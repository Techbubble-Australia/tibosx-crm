import { TICKET_PRIORITY_LABELS } from "@/lib/support-ticket-labels";

export function ticketPriorityDotClass(priority: string | null | undefined): string {
  switch ((priority ?? "").toUpperCase()) {
    case "LOW":
      return "bg-yellow-400";
    case "MEDIUM":
      return "bg-amber-500";
    case "HIGH":
      return "bg-red-500";
    case "URGENT":
      return "bg-red-800";
    default:
      return "bg-gray-400";
  }
}

/** @deprecated Use TicketPriorityBadge (dot style). Kept for any legacy class lookups. */
export function ticketPriorityBadgeClass(priority: string | null | undefined): string {
  return ticketPriorityDotClass(priority);
}

export function TicketPriorityBadge({ priority }: { priority: string | null | undefined }) {
  const key = (priority ?? "").toUpperCase();
  const label = TICKET_PRIORITY_LABELS[key] ?? priority ?? "—";
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${ticketPriorityDotClass(priority)}`}
        aria-hidden
      />
      {label}
    </span>
  );
}
