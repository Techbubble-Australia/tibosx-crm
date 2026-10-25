import { TICKET_PRIORITY_LABELS } from "@/lib/support-ticket-labels";

export function ticketPriorityBadgeClass(priority: string | null | undefined): string {
  switch ((priority ?? "").toUpperCase()) {
    case "LOW":
      return "bg-yellow-100 text-yellow-900 ring-1 ring-inset ring-yellow-300/80";
    case "MEDIUM":
      return "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300/80";
    case "HIGH":
      return "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200";
    case "URGENT":
      return "bg-red-700 text-white ring-1 ring-inset ring-red-800";
    default:
      return "bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200";
  }
}

export function TicketPriorityBadge({ priority }: { priority: string | null | undefined }) {
  const key = (priority ?? "").toUpperCase();
  const label = TICKET_PRIORITY_LABELS[key] ?? priority ?? "—";
  return (
    <span
      className={`inline-flex min-h-[1.5rem] items-center rounded-md px-2.5 py-1 text-xs font-semibold ${ticketPriorityBadgeClass(priority)}`}
    >
      {label}
    </span>
  );
}
