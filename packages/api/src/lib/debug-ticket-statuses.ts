import { prisma } from "@techbubble/database";

export const DEBUG_STATUS_COLORS = [
  "amber",
  "sky",
  "violet",
  "emerald",
  "rose",
  "orange",
  "teal",
  "indigo",
  "pink",
  "slate",
] as const;
export type DebugStatusColor = (typeof DEBUG_STATUS_COLORS)[number];

export async function listDebugTicketStatuses() {
  return prisma.debugTicketStatus.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
}

export async function isDebugTicketStatus(key: string): Promise<boolean> {
  const row = await prisma.debugTicketStatus.findUnique({ where: { key }, select: { id: true } });
  return Boolean(row);
}

/** Status immediately before `key` on the board (used by bulk "advance"). */
export async function previousDebugTicketStatus(key: string): Promise<string | null> {
  const rows = await listDebugTicketStatuses();
  const index = rows.findIndex((row) => row.key === key);
  return index > 0 ? rows[index - 1]!.key : null;
}

/** BLOCKED, WAITING_ON_CLIENT, … unique against existing keys. */
export async function statusKeyFromLabel(label: string): Promise<string> {
  const base =
    label
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "STATUS";
  let key = base;
  for (let n = 2; await isDebugTicketStatus(key); n += 1) {
    key = `${base}_${n}`;
  }
  return key;
}

export function serializeDebugTicketStatus(row: {
  key: string;
  label: string;
  color: string;
  position: number;
  isSystem: boolean;
}) {
  return { key: row.key, label: row.label, color: row.color, position: row.position, isSystem: row.isSystem };
}
