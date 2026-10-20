import { TICKET_STATUS_LABELS, normalizeTicketStatusKey } from "@/lib/support-ticket-labels";

/** Badge classes for ticket status — background color is the primary cue (not font color). */
export function ticketStatusBadgeClass(status: string): string {
  switch (normalizeTicketStatusKey(status)) {
    case "DRAFT":
      return "bg-gray-200 text-gray-900";
    case "OPEN":
      return "bg-gray-300 text-gray-900";
    case "IN_PROGRESS":
      return "bg-amber-300 text-gray-900";
    case "PENDING_CLIENT":
      return "bg-blue-300 text-gray-900";
    case "RESOLVED":
      return "bg-green-200 text-gray-900";
    case "CLOSED":
      return "bg-green-800 text-white";
    case "CANCELLED":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-200 text-gray-900";
  }
}

export function TicketStatusBadge({ status }: { status: string }) {
  const key = normalizeTicketStatusKey(status);
  const label =
    TICKET_STATUS_LABELS[key] ??
    (status?.trim() ? status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "—");
  return (
    <span
      className={`inline-flex min-h-[1.5rem] items-center rounded-md px-2.5 py-1 text-xs font-semibold ${ticketStatusBadgeClass(status)}`}
    >
      {label}
    </span>
  );
}
