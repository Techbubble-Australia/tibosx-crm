import { prisma, type Prisma } from "@techbubble/database";

type Db = Prisma.TransactionClient | typeof prisma;

export type DebugTicketLogAction =
  | "CREATED"
  | "STATUS_CHANGED"
  | "UPDATED"
  | "SCREENSHOTS_ADDED"
  | "SCREENSHOT_REMOVED"
  | "COMMENT_ADDED"
  | "COMMENT_EDITED"
  | "COMMENT_DELETED";

export type DebugTicketActor = { userId: string | null; email: string };

export const AI_AGENT_ACTOR: DebugTicketActor = { userId: null, email: "AI agent" };

export async function logDebugTicket(
  db: Db,
  ticketId: string,
  actor: DebugTicketActor,
  entries: Array<{ action: DebugTicketLogAction; field?: string; oldValue?: string | null; newValue?: string | null }>,
) {
  if (!entries.length) return;
  await db.debugCaptureTicketLog.createMany({
    data: entries.map((entry) => ({
      ticketId,
      action: entry.action,
      field: entry.field ?? null,
      oldValue: entry.oldValue ?? null,
      newValue: entry.newValue ?? null,
      actorUserId: actor.userId,
      actorEmail: actor.email,
    })),
  });
}

export function serializeDebugTicketLog(row: {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  actorUserId: string | null;
  actorEmail: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    action: row.action,
    field: row.field,
    oldValue: row.oldValue,
    newValue: row.newValue,
    actorUserId: row.actorUserId,
    actorEmail: row.actorEmail,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Short text for the activity log: the start of a comment, or the attachment count when there's no text. */
export function commentLogPreview(body: string, attachmentCount: number): string {
  const text = body.replace(/\s+/g, " ").trim();
  if (text) return text.length > 160 ? `${text.slice(0, 157)}…` : text;
  return `${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`;
}
