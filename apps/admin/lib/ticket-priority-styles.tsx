import { TICKET_PRIORITY_LABELS } from "@/lib/support-ticket-labels";

export function ticketPriorityDotClass(priority: string | null | undefined): string {
  switch ((priority ?? "").toUpperCase()) {
    case "LOW":
      return "bg-blue-500 ring-1 ring-blue-200";
    case "MEDIUM":
      return "bg-amber-500 ring-1 ring-amber-200";
    case "HIGH":
      return "bg-red-500 ring-1 ring-red-200";
    case "URGENT":
      return "bg-red-600 ring-1 ring-red-300";
    default:
      return "bg-gray-500 ring-1 ring-gray-200";
  }
}

/** @deprecated Use TicketPriorityBadge (dot style). Kept for any legacy class lookups. */
export function ticketPriorityBadgeClass(priority: string | null | undefined): string {
  return ticketPriorityDotClass(priority);
}

export function TicketPriorityDot({ priority }: { priority: string | null | undefined }) {
  return (
    <span
      className={`inline-block h-3 w-3 shrink-0 rounded-full ${ticketPriorityDotClass(priority)}`}
      aria-hidden
    />
  );
}

export function TicketPriorityBadge({ priority }: { priority: string | null | undefined }) {
  const key = (priority ?? "").toUpperCase();
  const label = TICKET_PRIORITY_LABELS[key] ?? priority ?? "—";
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
      <TicketPriorityDot priority={priority} />
      {label}
    </span>
  );
}
