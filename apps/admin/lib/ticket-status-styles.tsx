import { normalizeTicketStatusKey, ticketStatusLabel } from "@/lib/support-ticket-labels";

/** Badge classes for ticket status — background color is the primary cue (not font color). */
export function ticketStatusBadgeClass(status: string | null | undefined): string {
  switch (normalizeTicketStatusKey(status)) {
    case "DRAFT":
      return "bg-gray-200 text-gray-800";
    case "OPEN":
      return "bg-[#e0f2fe] text-[#0c4a6e] ring-1 ring-inset ring-sky-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-900";
    case "PENDING_CLIENT":
      return "bg-blue-100 text-blue-900";
    case "RESOLVED":
      return "bg-[#d1fae5] text-[#065f46] ring-1 ring-inset ring-emerald-200";
    case "CLOSED":
      return "bg-[#a7f3d0] text-[#064e3b] ring-1 ring-inset ring-emerald-300";
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
