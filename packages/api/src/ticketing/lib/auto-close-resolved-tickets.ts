import { TicketStatus, prisma } from "@techbubble/database";
import { resolvedReadyForAutoClose } from "./ticket-lifecycle.js";
import { logTicketAudit } from "./ticket-audit.js";

/** Close tickets that have been resolved longer than the auto-close window. */
export async function autoCloseStaleResolvedTickets(): Promise<void> {
  const resolved = await prisma.ticket.findMany({
    where: { status: TicketStatus.RESOLVED },
    select: { id: true, updatedAt: true },
    take: 200,
  });
  const now = new Date();
  for (const row of resolved) {
    if (!resolvedReadyForAutoClose(row.updatedAt, now)) continue;
    await prisma.ticket.update({
      where: { id: row.id },
      data: { status: TicketStatus.CLOSED, closedAt: now, updatedAt: now },
    });
    await logTicketAudit(row.id, null, "UPDATED", {
      field: "status",
      oldValue: TicketStatus.RESOLVED,
      newValue: TicketStatus.CLOSED,
      metadata: { autoClosed: true },
    });
  }
}
