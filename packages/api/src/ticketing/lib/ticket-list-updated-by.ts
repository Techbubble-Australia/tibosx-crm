import { prisma } from "@techbubble/database";

type TicketRow = {
  id: string;
  updatedAt: Date;
  createdAt: Date;
  updatedBy?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
};

/** When updatedBy is missing but the ticket changed, use the latest audit actor. */
export async function enrichTicketsUpdatedBy<T extends TicketRow>(rows: T[]): Promise<T[]> {
  const needs = rows.filter(
    (row) =>
      !row.updatedBy?.name?.trim() &&
      !row.updatedBy?.email?.trim() &&
      row.updatedAt.getTime() > row.createdAt.getTime(),
  );
  if (!needs.length) return rows;

  const ids = needs.map((row) => row.id);
  const logs = await prisma.ticketAuditLog.findMany({
    where: { ticketId: { in: ids } },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { id: true, name: true, email: true } } },
  });

  const actorByTicket = new Map<string, { id: string; name: string; email: string }>();
  for (const log of logs) {
    if (!actorByTicket.has(log.ticketId) && log.actor) {
      actorByTicket.set(log.ticketId, log.actor);
    }
  }

  return rows.map((row) => {
    if (row.updatedBy?.name?.trim() || row.updatedBy?.email?.trim()) return row;
    const actor = actorByTicket.get(row.id);
    if (!actor) return row;
    return { ...row, updatedBy: actor };
  });
}
