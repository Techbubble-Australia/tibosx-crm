import { normalizeTicketStatusKey, ticketStatusLabel } from "@/lib/support-ticket-labels";

/** Badge classes for ticket status — background color is the primary cue (not font color). */
export function ticketStatusBadgeClass(status: string | null | undefined): string {
  switch (normalizeTicketStatusKey(status)) {
    case "DRAFT":
      return "bg-gray-500 text-white";
    case "OPEN":
      return "bg-sky-600 text-white";
    case "IN_PROGRESS":
      return "bg-amber-600 text-white";
    case "PENDING_CLIENT":
      return "bg-blue-600 text-white";
    case "RESOLVED":
      return "bg-emerald-600 text-white";
    case "CLOSED":
      return "bg-emerald-800 text-white";
    case "CANCELLED":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

export function TicketStatusBadge({ status }: { status: string | null | undefined }) {
  const label = ticketStatusLabel(status);
  return (
    <span
      className={`inline-flex min-h-[1.5rem] items-center rounded-md px-2.5 py-1 text-xs font-semibold ${ticketStatusBadgeClass(status)}`}
    >
      {label}
    </span>
  );
}
