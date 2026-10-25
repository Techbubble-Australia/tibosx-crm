import { prisma } from "@techbubble/database";

type TicketRow = {
  id: string;
  updatedAt: Date;
  createdAt: Date;
  updatedById?: string | null;
  updatedBy?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
};

function hasUpdaterLabel(user?: { name: string; email: string } | null): boolean {
  return Boolean(user?.name?.trim() || user?.email?.trim());
}

/** When updatedBy is missing but the ticket changed, use updatedById or the latest audit actor. */
export async function enrichTicketsUpdatedBy<T extends TicketRow>(rows: T[]): Promise<T[]> {
  const needsAudit = rows.filter(
    (row) =>
      !hasUpdaterLabel(row.updatedBy) &&
      row.updatedAt.getTime() > row.createdAt.getTime(),
  );
  if (!needsAudit.length) return rows;

  const ids = needsAudit.map((row) => row.id);
  const logs = await prisma.ticketAuditLog.findMany({
    where: { ticketId: { in: ids } },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { id: true, name: true, email: true } } },
  });

  const actorByTicket = new Map<string, { id: string; name: string; email: string }>();
  for (const log of logs) {
    if (!actorByTicket.has(log.ticketId) && log.actor && hasUpdaterLabel(log.actor)) {
      actorByTicket.set(log.ticketId, log.actor);
    }
  }

  const missingById = needsAudit
    .filter((row) => !actorByTicket.has(row.id) && row.updatedById)
    .map((row) => row.updatedById as string);
  const uniqueUpdaterIds = [...new Set(missingById)];
  const usersById = new Map<string, { id: string; name: string; email: string }>();
  if (uniqueUpdaterIds.length) {
    const users = await prisma.ticketingUser.findMany({
      where: { id: { in: uniqueUpdaterIds } },
      select: { id: true, name: true, email: true },
    });
    for (const user of users) {
      if (hasUpdaterLabel(user)) usersById.set(user.id, user);
    }
  }

  return rows.map((row) => {
    if (hasUpdaterLabel(row.updatedBy)) return row;
    const fromAudit = actorByTicket.get(row.id);
    if (fromAudit) return { ...row, updatedBy: fromAudit };
    if (row.updatedById) {
      const fromId = usersById.get(row.updatedById);
      if (fromId) return { ...row, updatedBy: fromId };
    }
    return row;
  });
}
