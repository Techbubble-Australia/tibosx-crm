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

function looksLikeTicketingUserId(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return /^c[a-z0-9]{20,}$/i.test(trimmed);
}

export async function enrichTicketAuditLogsForDisplay<
  T extends {
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
  },
>(logs: T[]): Promise<T[]> {
  const ids = new Set<string>();
  for (const log of logs) {
    if (log.field !== "assignedToId") continue;
    for (const value of [log.oldValue, log.newValue]) {
      if (looksLikeTicketingUserId(value)) ids.add(value!.trim());
    }
  }
  if (!ids.size) return logs;

  const users = await prisma.ticketingUser.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, name: true, email: true },
  });
  const labelById = new Map(
    users.map((row) => [row.id, row.name?.trim() || row.email?.trim() || "Unassigned"]),
  );

  return logs.map((log) => {
    if (log.field !== "assignedToId") return log;
    const mapValue = (value: string | null) => {
      if (!value || value === "null") return value;
      if (!looksLikeTicketingUserId(value)) return value;
      return labelById.get(value.trim()) ?? "Unassigned";
    };
    return {
      ...log,
      field: "assignedTo",
      oldValue: mapValue(log.oldValue),
      newValue: mapValue(log.newValue),
    };
  });
}
