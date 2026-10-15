import { TicketStatus } from "@techbubble/database";

export type TicketLifecycleAction =
  | "reopen"
  | "start_work"
  | "client_info_needed"
  | "resolve"
  | "close"
  | "cancel";

export function nextStatusForLifecycleAction(
  current: TicketStatus,
  action: TicketLifecycleAction,
): TicketStatus | null {
  switch (action) {
    case "reopen":
      return current === TicketStatus.RESOLVED ? TicketStatus.OPEN : null;
    case "start_work":
      return current === TicketStatus.OPEN || current === TicketStatus.DRAFT
        ? TicketStatus.IN_PROGRESS
        : null;
    case "client_info_needed":
      return current === TicketStatus.IN_PROGRESS ? TicketStatus.PENDING_CLIENT : null;
    case "resolve":
      return current === TicketStatus.IN_PROGRESS ? TicketStatus.RESOLVED : null;
    case "close":
      return current === TicketStatus.RESOLVED ? TicketStatus.CLOSED : null;
    case "cancel":
      return current === TicketStatus.DRAFT ||
        current === TicketStatus.OPEN ||
        current === TicketStatus.IN_PROGRESS ||
        current === TicketStatus.PENDING_CLIENT
        ? TicketStatus.CANCELLED
        : null;
    default:
      return null;
  }
}

export function canPerformLifecycleAction(
  role: "CLIENT" | "CONSULTANT",
  action: TicketLifecycleAction,
): boolean {
  if (role === "CONSULTANT") {
    return action === "start_work" || action === "client_info_needed" || action === "resolve";
  }
  return action === "reopen" || action === "close" || action === "cancel";
}

export const RESOLVED_AUTO_CLOSE_DAYS = 10;

export function resolvedReadyForAutoClose(resolvedAt: Date, now = new Date()): boolean {
  const ms = RESOLVED_AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() - resolvedAt.getTime() >= ms;
}
