import { normalizeTicketStatusKey, ticketStatusLabel } from "@/lib/support-ticket-labels";

/** Badge classes for ticket status — background color is the primary cue (not font color). */
export function ticketStatusBadgeClass(status: string | null | undefined): string {
  switch (normalizeTicketStatusKey(status)) {
    case "DRAFT":
      return "bg-gray-200 text-gray-900 ring-1 ring-gray-300";
    case "OPEN":
      return "bg-sky-200 text-sky-950 ring-1 ring-sky-400";
    case "IN_PROGRESS":
      return "bg-amber-300 text-amber-950 ring-1 ring-amber-500";
    case "PENDING_CLIENT":
      return "bg-blue-200 text-blue-950 ring-1 ring-blue-400";
    case "RESOLVED":
      return "bg-emerald-200 text-emerald-950 ring-1 ring-emerald-500";
    case "CLOSED":
      return "bg-emerald-700 text-white ring-1 ring-emerald-900";
    case "CANCELLED":
      return "bg-red-600 text-white ring-1 ring-red-800";
    default:
      return "bg-gray-200 text-gray-900 ring-1 ring-gray-300";
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
