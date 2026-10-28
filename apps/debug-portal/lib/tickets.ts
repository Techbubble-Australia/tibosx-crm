export const TICKET_STATUSES = ["PENDING", "IN_PROGRESS", "FOR_REVIEW", "COMPLETED"] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  FOR_REVIEW: "For review",
  COMPLETED: "Completed",
};

export function statusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-900";
    case "IN_PROGRESS":
      return "bg-sky-100 text-sky-900";
    case "FOR_REVIEW":
      return "bg-violet-100 text-violet-900";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-900";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

export function resolveScreenshotUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const t = url.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("/uploads/")) {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
    if (base) return `${base}${t}`;
    return t;
  }
  return t;
}
