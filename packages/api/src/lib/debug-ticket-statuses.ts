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

export type BoardFamily = "WORK" | "STRATEGY";

export function boardFamilyForHierarchyLevel(level: number): BoardFamily {
  return level === 1 || level === 2 ? "STRATEGY" : "WORK";
}

export function parseBoardFamily(raw: string | null | undefined): BoardFamily {
  return raw === "STRATEGY" ? "STRATEGY" : "WORK";
}

export function defaultStatusForFamily(family: BoardFamily): string {
  return family === "STRATEGY" ? "PLANNED" : "PENDING";
}

export async function listDebugTicketStatuses(family: BoardFamily = "WORK") {
  return prisma.debugTicketStatus.findMany({
    where: { boardFamily: family },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
}

export async function isDebugTicketStatus(key: string, family: BoardFamily): Promise<boolean> {
  const row = await prisma.debugTicketStatus.findUnique({
    where: { boardFamily_key: { boardFamily: family, key } },
    select: { id: true },
  });
  return Boolean(row);
}

/** Status immediately before `key` on that family's board (used by bulk "advance"). */
export async function previousDebugTicketStatus(key: string, family: BoardFamily): Promise<string | null> {
  const rows = await listDebugTicketStatuses(family);
  const index = rows.findIndex((row) => row.key === key);
  return index > 0 ? rows[index - 1]!.key : null;
}

/** BLOCKED, WAITING_ON_CLIENT, … unique against existing keys in the family. */
export async function statusKeyFromLabel(label: string, family: BoardFamily): Promise<string> {
  const base =
    label
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "STATUS";
  let key = base;
  for (let n = 2; await isDebugTicketStatus(key, family); n += 1) {
    key = `${base}_${n}`;
  }
  return key;
}

const STRATEGY_KEYS = new Set(["PLANNED", "ACTIVE", "DONE"]);

export function serializeDebugTicketStatus(row: {
  key: string;
  label: string;
  color: string;
  position: number;
  isSystem: boolean;
  boardFamily?: BoardFamily | string | null;
}) {
  const family: BoardFamily =
    row.boardFamily === "STRATEGY" || row.boardFamily === "WORK"
      ? row.boardFamily
      : STRATEGY_KEYS.has(row.key)
        ? "STRATEGY"
        : "WORK";
  return {
    key: row.key,
    label: row.label,
    color: row.color,
    position: row.position,
    isSystem: row.isSystem,
    boardFamily: family,
  };
}
