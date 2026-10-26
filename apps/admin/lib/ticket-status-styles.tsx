import { normalizeTicketStatusKey, ticketStatusLabel } from "@/lib/support-ticket-labels";

/** Badge classes for ticket status — background color is the primary cue (not font color). */
export function ticketStatusBadgeClass(status: string | null | undefined): string {
  switch (normalizeTicketStatusKey(status)) {
    case "DRAFT":
      return "bg-gray-200 text-gray-800";
    case "OPEN":
      return "bg-blue-100 text-blue-900";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-900";
    case "PENDING_CLIENT":
      return "bg-blue-100 text-blue-900";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-900";
    case "CLOSED":
      return "bg-gray-200 text-gray-800";
    case "CANCELLED":
      return "bg-red-100 text-red-900";
    default:
      return "bg-gray-200 text-gray-800";
  }
}

export function TicketStatusBadge({ status }: { status: string | null | undefined }) {
  const label = ticketStatusLabel(status);
  return (
    <span
      className={`inline-flex min-h-[1.5rem] whitespace-nowrap items-center rounded-md px-2.5 py-1 text-xs font-semibold ${ticketStatusBadgeClass(status)}`}
    >
      {label}
    </span>
  );
}
