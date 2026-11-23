import { prisma } from "@techbubble/database";

export const DEBUG_ISSUE_TYPES = [
  "INITIATIVE",
  "EPIC",
  "STORY",
  "TASK",
  "BUG",
  "SUBTASK",
] as const;

export type DebugIssueType = (typeof DEBUG_ISSUE_TYPES)[number];

export const DEBUG_LINK_TYPES = ["BLOCKS", "BLOCKED_BY", "RELATES_TO"] as const;
export type DebugLinkType = (typeof DEBUG_LINK_TYPES)[number];

export const HIERARCHY_LEVEL_BY_TYPE: Record<DebugIssueType, number> = {
  INITIATIVE: 2,
  EPIC: 1,
  STORY: 0,
  TASK: 0,
  BUG: 0,
  SUBTASK: -1,
};

export const ISSUE_TYPES_BY_LEVEL: Record<number, DebugIssueType[]> = {
  2: ["INITIATIVE"],
  1: ["EPIC"],
  0: ["STORY", "TASK", "BUG"],
  [-1]: ["SUBTASK"],
};

export function isDebugIssueType(value: string): value is DebugIssueType {
  return (DEBUG_ISSUE_TYPES as readonly string[]).includes(value);
}

export function isDebugLinkType(value: string): value is DebugLinkType {
  return (DEBUG_LINK_TYPES as readonly string[]).includes(value);
}

export function hierarchyLevelForType(type: DebugIssueType): number {
  return HIERARCHY_LEVEL_BY_TYPE[type];
}

export function typesForHierarchyLevel(level: number): DebugIssueType[] {
  return ISSUE_TYPES_BY_LEVEL[level] ?? [];
}

export class HierarchyValidationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "HierarchyValidationError";
    this.statusCode = statusCode;
  }
}

function assertParentAllowed(type: DebugIssueType, parentType: DebugIssueType | null): void {
  const level = hierarchyLevelForType(type);

  if (type === "INITIATIVE") {
    if (parentType != null) {
      throw new HierarchyValidationError("Initiatives cannot have a parent.");
    }
    return;
  }

  if (type === "SUBTASK") {
    if (parentType == null) {
      throw new HierarchyValidationError("Subtasks require a parent story, task, or bug.");
    }
    if (hierarchyLevelForType(parentType) !== 0) {
      throw new HierarchyValidationError("Subtasks must belong to a story, task, or bug.");
    }
    return;
  }

  if (parentType == null) return;

  const parentLevel = hierarchyLevelForType(parentType);
  if (parentLevel !== level + 1) {
    throw new HierarchyValidationError(
      `A ${type.toLowerCase()} parent must be one level above it (expected level ${level + 1}, got ${parentLevel}).`,
    );
  }
}

/** Walk ancestors to ensure parentId is not this ticket or any descendant. */
async function assertNoCycle(ticketId: string | null, parentId: string): Promise<void> {
  if (ticketId && parentId === ticketId) {
    throw new HierarchyValidationError("A ticket cannot be its own parent.");
  }

  let currentId: string | null = parentId;
  const seen = new Set<string>();
  while (currentId) {
    if (ticketId && currentId === ticketId) {
      throw new HierarchyValidationError("Cannot set a descendant as the parent (cycle detected).");
    }
    if (seen.has(currentId)) {
      throw new HierarchyValidationError("Invalid parent chain (cycle detected).");
    }
    seen.add(currentId);
    const row: { parentId: string | null } | null = await prisma.debugCaptureTicket.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = row?.parentId ?? null;
  }
}

export type HierarchyResolveInput = {
  /** Existing ticket id when updating; null when creating. */
  ticketId?: string | null;
  type: DebugIssueType;
  parentId?: string | null;
};

export type HierarchyResolveResult = {
  type: DebugIssueType;
  hierarchyLevel: number;
  parentId: string | null;
};

/**
 * Validate and normalize type + parent for create/update.
 * Pass `parentId: undefined` on update to leave the existing parent unchanged
 * (caller should resolve the effective parent before calling).
 */
export async function resolveHierarchyFields(
  input: HierarchyResolveInput,
): Promise<HierarchyResolveResult> {
  const type = input.type;
  if (!isDebugIssueType(type)) {
    throw new HierarchyValidationError("Invalid issue type.");
  }

  const hierarchyLevel = hierarchyLevelForType(type);
  let parentId = input.parentId === undefined ? null : input.parentId;

  if (parentId === "") parentId = null;

  if (type === "INITIATIVE") {
    parentId = null;
  }

  if (type === "SUBTASK" && !parentId) {
    throw new HierarchyValidationError("Subtasks require a parent story, task, or bug.");
  }

  let parentType: DebugIssueType | null = null;
  if (parentId) {
    const parent = await prisma.debugCaptureTicket.findUnique({
      where: { id: parentId },
      select: { id: true, type: true },
    });
    if (!parent) {
      throw new HierarchyValidationError("Parent ticket not found.", 404);
    }
    parentType = parent.type as DebugIssueType;
    await assertNoCycle(input.ticketId ?? null, parentId);
  }

  assertParentAllowed(type, parentType);

  return { type, hierarchyLevel, parentId };
}

export async function assertCanDeleteTicket(ticketId: string): Promise<void> {
  const childCount = await prisma.debugCaptureTicket.count({ where: { parentId: ticketId } });
  if (childCount > 0) {
    throw new HierarchyValidationError(
      `This ticket has ${childCount} child ticket${childCount === 1 ? "" : "s"}. Reparent or delete them before deleting this ticket.`,
      409,
    );
  }
}
