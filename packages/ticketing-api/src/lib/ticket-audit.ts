import type { Prisma } from "@techbubble/ticketing-database";
import { ticketingPrisma } from "@techbubble/ticketing-database";

export async function logTicketAudit(
  ticketId: string,
  actorId: string | null,
  action: string,
  details?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await ticketingPrisma.ticketAuditLog.create({
    data: {
      ticketId,
      actorId,
      action,
      field: details?.field,
      oldValue: details?.oldValue,
      newValue: details?.newValue,
      metadata: details?.metadata,
    },
  });
}
