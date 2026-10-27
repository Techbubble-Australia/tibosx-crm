import type { Prisma } from "@techbubble/database";
import { prisma } from "@techbubble/database";

export async function formatTicketAssigneeAuditValue(
  assignedToId: string | null | undefined,
): Promise<string> {
  if (!assignedToId) return "Unassigned";
  const user = await prisma.ticketingUser.findUnique({
    where: { id: assignedToId },
    select: { name: true, email: true },
  });
  return user?.name?.trim() || user?.email?.trim() || "Unassigned";
}

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
  await prisma.ticketAuditLog.create({
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
