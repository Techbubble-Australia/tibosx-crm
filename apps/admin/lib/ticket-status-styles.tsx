import { TICKET_STATUS_LABELS } from "@/lib/support-ticket-labels";

function normalizeTicketStatus(status: string): string {
  return status.trim().toUpperCase().replace(/\s+/g, "_");
}

/** Badge classes for ticket status — background color is the primary cue (not font color). */
export function ticketStatusBadgeClass(status: string): string {
  switch (normalizeTicketStatus(status)) {
    case "DRAFT":
      return "bg-gray-200 text-gray-900";
    case "OPEN":
      return "bg-gray-300 text-gray-900";
    case "IN_PROGRESS":
      return "bg-amber-300 text-amber-950";
    case "PENDING_CLIENT":
      return "bg-blue-300 text-blue-950";
    case "RESOLVED":
      return "bg-green-200 text-green-950";
    case "CLOSED":
      return "bg-green-800 text-white";
    case "CANCELLED":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-200 text-gray-900";
  }
}

export function TicketStatusBadge({ status }: { status: string }) {
  const key = normalizeTicketStatus(status);
  const label = TICKET_STATUS_LABELS[key] ?? status;
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${ticketStatusBadgeClass(status)}`}
    >
      {label}
    </span>
  );
}
