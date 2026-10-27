import type { CSSProperties } from "react";
import { normalizeTicketStatusKey, ticketStatusLabel } from "@/lib/support-ticket-labels";

/** Badge classes for ticket status — background color is the primary cue (not font color). */
export function ticketStatusBadgeClass(status: string | null | undefined): string {
  switch (normalizeTicketStatusKey(status)) {
    case "DRAFT":
      return "bg-gray-200 text-gray-800";
    case "OPEN":
      return "bg-red-100 text-red-900";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-900";
    case "PENDING_CLIENT":
      return "bg-blue-100 text-blue-900";
    case "RESOLVED":
      return "bg-green-100 text-green-900";
    case "CLOSED":
      return "bg-gray-200 text-gray-800";
    case "CANCELLED":
      return "bg-red-100 text-red-900";
    default:
      return "bg-gray-200 text-gray-800";
  }
}

/** Inline fallback so status pills keep color if utility classes are overridden in tables. */
export function ticketStatusBadgeStyle(status: string | null | undefined): CSSProperties | undefined {
  switch (normalizeTicketStatusKey(status)) {
    case "OPEN":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    case "RESOLVED":
      return { backgroundColor: "#dcfce7", color: "#166534" };
    case "CLOSED":
      return { backgroundColor: "#e5e7eb", color: "#374151" };
    case "IN_PROGRESS":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "PENDING_CLIENT":
      return { backgroundColor: "#dbeafe", color: "#1e3a8a" };
    case "CANCELLED":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return undefined;
  }
}

export function TicketStatusBadge({ status }: { status: string | null | undefined }) {
  const label = ticketStatusLabel(status);
  const inlineStyle = ticketStatusBadgeStyle(status);
  return (
    <span
      style={inlineStyle}
      className={`inline-flex min-h-[1.5rem] whitespace-nowrap items-center rounded-md px-2.5 py-1 text-xs font-semibold ${ticketStatusBadgeClass(status)}`}
    >
      {label}
    </span>
  );
}
