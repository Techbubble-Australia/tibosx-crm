import { TICKET_STATUS_LABELS } from "@/lib/support-ticket-labels";

/** Badge classes for ticket status on list views. */
export function ticketStatusBadgeClass(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-700 ring-gray-200";
    case "OPEN":
      return "bg-slate-100 text-slate-800 ring-slate-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "PENDING_CLIENT":
      return "bg-blue-100 text-blue-900 ring-blue-200";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "CLOSED":
      return "bg-green-800 text-white ring-green-900";
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
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ticketStatusBadgeClass(status)}`}
    >
      {label}
    </span>
  );
}
