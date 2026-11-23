import { resolveMediaPreviewUrl } from "@/lib/media-url";

/** Key of a board status (built-in: PENDING, IN_PROGRESS, FOR_REVIEW, COMPLETED; admins can add more). */
export type TicketStatus = string;

export type StatusOption = {
  key: string;
  label: string;
  color: string;
  position: number;
  isSystem: boolean;
};

export const DEBUG_ISSUE_TYPES = [
  "INITIATIVE",
  "EPIC",
  "STORY",
  "TASK",
  "BUG",
  "SUBTASK",
] as const;

export type DebugIssueType = (typeof DEBUG_ISSUE_TYPES)[number];

export const HIERARCHY_LEVELS = [2, 1, 0, -1] as const;
export type HierarchyLevel = (typeof HIERARCHY_LEVELS)[number];

export const HIERARCHY_LEVEL_BY_TYPE: Record<DebugIssueType, HierarchyLevel> = {
  INITIATIVE: 2,
  EPIC: 1,
  STORY: 0,
  TASK: 0,
  BUG: 0,
  SUBTASK: -1,
};

export const ISSUE_TYPES_BY_LEVEL: Record<HierarchyLevel, DebugIssueType[]> = {
  2: ["INITIATIVE"],
  1: ["EPIC"],
  0: ["STORY", "TASK", "BUG"],
  [-1]: ["SUBTASK"],
};

export const BOARD_LEVEL_TABS: Array<{ level: HierarchyLevel; label: string; description: string }> = [
  { level: 2, label: "Initiatives", description: "Top-level initiatives" },
  { level: 1, label: "Epics", description: "Feature containers" },
  { level: 0, label: "Work items", description: "Stories, tasks, and bugs" },
  { level: -1, label: "Subtasks", description: "Steps under a work item" },
];

export function isDebugIssueType(value: string): value is DebugIssueType {
  return (DEBUG_ISSUE_TYPES as readonly string[]).includes(value);
}

export function parseHierarchyLevel(raw: string | null | undefined): HierarchyLevel {
  const n = Number.parseInt(String(raw ?? ""), 10);
  return (HIERARCHY_LEVELS as readonly number[]).includes(n) ? (n as HierarchyLevel) : 0;
}

export function defaultTypeForLevel(level: HierarchyLevel): DebugIssueType {
  return ISSUE_TYPES_BY_LEVEL[level][0]!;
}

export function typesForLevel(level: HierarchyLevel): DebugIssueType[] {
  return ISSUE_TYPES_BY_LEVEL[level];
}

/** Used until the board's statuses load (and if the statuses API is unavailable). */
export const DEFAULT_STATUSES: StatusOption[] = [
  { key: "PENDING", label: "Pending", color: "amber", position: 0, isSystem: true },
  { key: "IN_PROGRESS", label: "In progress", color: "sky", position: 1, isSystem: true },
  { key: "FOR_REVIEW", label: "For review", color: "violet", position: 2, isSystem: true },
  { key: "COMPLETED", label: "Completed", color: "emerald", position: 3, isSystem: true },
];

export const STATUS_COLORS = [
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

/** Literal class names per palette colour (Tailwind needs them spelled out). */
const STATUS_COLOR_CLASSES: Record<string, { badge: string; accent: string; swatch: string }> = {
  amber: { badge: "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80", accent: "border-t-amber-400", swatch: "bg-amber-400" },
  sky: { badge: "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80", accent: "border-t-sky-500", swatch: "bg-sky-500" },
  violet: { badge: "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80", accent: "border-t-violet-500", swatch: "bg-violet-500" },
  emerald: { badge: "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80", accent: "border-t-emerald-500", swatch: "bg-emerald-500" },
  rose: { badge: "bg-rose-100 text-rose-900 ring-1 ring-rose-200/80", accent: "border-t-rose-500", swatch: "bg-rose-500" },
  orange: { badge: "bg-orange-100 text-orange-900 ring-1 ring-orange-200/80", accent: "border-t-orange-500", swatch: "bg-orange-500" },
  teal: { badge: "bg-teal-100 text-teal-900 ring-1 ring-teal-200/80", accent: "border-t-teal-500", swatch: "bg-teal-500" },
  indigo: { badge: "bg-indigo-100 text-indigo-900 ring-1 ring-indigo-200/80", accent: "border-t-indigo-500", swatch: "bg-indigo-500" },
  pink: { badge: "bg-pink-100 text-pink-900 ring-1 ring-pink-200/80", accent: "border-t-pink-500", swatch: "bg-pink-500" },
  slate: { badge: "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80", accent: "border-t-slate-400", swatch: "bg-slate-400" },
};

export function statusColorClasses(color: string | undefined) {
  return STATUS_COLOR_CLASSES[color ?? ""] ?? STATUS_COLOR_CLASSES.slate!;
}

const TYPE_BADGE_CLASSES: Record<string, string> = {
  INITIATIVE: "bg-purple-100 text-purple-900 ring-1 ring-purple-300/80",
  EPIC: "bg-violet-100 text-violet-900 ring-1 ring-violet-300/80",
  STORY: "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300/80",
  TASK: "bg-sky-100 text-sky-900 ring-1 ring-sky-300/80",
  BUG: "bg-red-100 text-red-800 ring-1 ring-red-300/80",
  SUBTASK: "bg-slate-100 text-slate-800 ring-1 ring-slate-300/80",
};

export function typeBadgeClass(type: string): string {
  return TYPE_BADGE_CLASSES[type] ?? "bg-slate-100 text-slate-800 ring-1 ring-slate-300/80";
}

export const TICKET_TITLE_MAX = 200;

export function formatTicketType(type: string): string {
  switch (type) {
    case "INITIATIVE":
      return "Initiative";
    case "EPIC":
      return "Epic";
    case "STORY":
      return "Story";
    case "TASK":
      return "Task";
    case "BUG":
      return "Bug";
    case "SUBTASK":
      return "Subtask";
    case "ENHANCEMENT":
      return "Story";
    default:
      return type;
  }
}

export function typeBorderClass(type: string): string {
  switch (type) {
    case "INITIATIVE":
      return "border-l-purple-400";
    case "EPIC":
      return "border-l-violet-400";
    case "STORY":
      return "border-l-indigo-400";
    case "TASK":
      return "border-l-sky-400";
    case "SUBTASK":
      return "border-l-slate-400";
    default:
      return "border-l-red-400";
  }
}

export function formatEnvironment(env: string): string {
  if (env === "development") return "Development";
  if (env === "production") return "Production";
  if (env === "staging") return "Staging";
  return env;
}

export function resolveScreenshotUrl(url: string | null | undefined): string | null {
  return resolveMediaPreviewUrl(url);
}

/** Status moves allowed for non-admins (the API enforces the same rule). */
const MEMBER_STATUS_MOVES: Partial<Record<TicketStatus, TicketStatus>> = {
  FOR_REVIEW: "COMPLETED",
  COMPLETED: "PENDING",
};

export function memberStatusTarget(from: TicketStatus): TicketStatus | null {
  return MEMBER_STATUS_MOVES[from] ?? null;
}

export function canMoveStatus(isAdmin: boolean, from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return false;
  return isAdmin || memberStatusTarget(from) === to;
}

/** Next column on the board, used for bulk "advance" (null when `from` is the last column). */
export function nextStatusInOrder(statuses: StatusOption[], from: TicketStatus): TicketStatus | null {
  const index = statuses.findIndex((s) => s.key === from);
  return index >= 0 && index < statuses.length - 1 ? statuses[index + 1]!.key : null;
}
