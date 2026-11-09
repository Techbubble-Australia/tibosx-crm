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

export function typeBadgeClass(type: string): string {
  return type === "ENHANCEMENT"
    ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300/80"
    : "bg-red-100 text-red-800 ring-1 ring-red-300/80";
}

export function formatTicketType(type: string): string {
  return type === "ENHANCEMENT" ? "Enhancement" : type === "BUG" ? "Bug" : type;
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
