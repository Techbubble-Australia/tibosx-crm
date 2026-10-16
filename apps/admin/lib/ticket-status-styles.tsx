import { TICKET_STATUS_LABELS } from "@/lib/support-ticket-labels";

/** Badge classes for ticket status on list views. */
export function ticketStatusBadgeClass(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700 ring-gray-200";
    case "OPEN":
      return "bg-gray-200 text-gray-900 ring-gray-300";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "PENDING_CLIENT":
      return "bg-blue-100 text-blue-900 ring-blue-200";
    case "RESOLVED":
      return "bg-green-200 text-green-900 ring-green-300";
    case "CLOSED":
      return "bg-green-700 text-white ring-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800 ring-red-200";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-200";
  }
}

export function TicketStatusBadge({ status }: { status: string }) {
  const label = TICKET_STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ticketStatusBadgeClass(status)}`}
    >
      {label}
    </span>
  );
}
