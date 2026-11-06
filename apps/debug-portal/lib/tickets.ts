import { resolveMediaPreviewUrl } from "@/lib/media-url";

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
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80";
    case "IN_PROGRESS":
      return "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80";
    case "FOR_REVIEW":
      return "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

export function typeBadgeClass(type: string): string {
  return type === "ENHANCEMENT"
    ? "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200/80"
    : "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80";
}

export function formatTicketType(type: string): string {
  return type === "ENHANCEMENT" ? "Enhancement" : type === "BUG" ? "Bug" : type;
}

export function formatEnvironment(env: string): string {
  if (env === "development") return "Development";
  if (env === "production") return "Production";
  if (env === "staging") return "Staging";
  return env;
}

export function resolveScreenshotUrl(url: string | null | undefined): string | null {
  return resolveMediaPreviewUrl(url);
}

/** Status moves allowed for non-admins (the API enforces the same rule). */
const MEMBER_STATUS_MOVES: Partial<Record<TicketStatus, TicketStatus>> = {
  FOR_REVIEW: "COMPLETED",
  COMPLETED: "PENDING",
};

export function memberStatusTarget(from: TicketStatus): TicketStatus | null {
  return MEMBER_STATUS_MOVES[from] ?? null;
}

export function canMoveStatus(isAdmin: boolean, from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return false;
  return isAdmin || memberStatusTarget(from) === to;
}

/** Next workflow status when advancing tickets in bulk (null = no bulk advance). */
export function bulkAdvanceTargetStatus(from: TicketStatus): TicketStatus | null {
  switch (from) {
    case "PENDING":
      return "IN_PROGRESS";
    case "IN_PROGRESS":
      return "FOR_REVIEW";
    case "FOR_REVIEW":
      return "COMPLETED";
    default:
      return null;
  }
}
