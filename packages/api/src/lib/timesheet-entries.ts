import { z } from "zod";
import { prisma, type Prisma } from "@techbubble/database";

export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export const TIMESHEET_PERIODS = ["WEEKLY", "MONTHLY"] as const;
export type TimesheetPeriod = (typeof TIMESHEET_PERIODS)[number];

const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Weekly timesheets key hours by weekday (mon–sun); monthly timesheets key them by ISO date. */
export type DayKey = WeekdayKey | string;
export type DailyHours = Partial<Record<DayKey, number>>;
export type DailyComments = Partial<Record<DayKey, string>>;

export function isIsoDayKey(key: string): boolean {
  return ISO_DAY_RE.test(key);
}

function isDayKey(key: string): boolean {
  return (WEEKDAY_KEYS as readonly string[]).includes(key) || isIsoDayKey(key);
}

const dayKeySchema = z.string().refine(isDayKey, { message: "Invalid day key" });

export const dailyHoursSchema = z.record(
  dayKeySchema,
  z.preprocess((v) => (v === null || v === "" ? undefined : v), z.coerce.number().min(0).max(24).optional()),
);

export const dailyCommentsSchema = z.record(dayKeySchema, z.string().max(2000).optional());

export const timesheetEntryInputSchema = z
  .object({
    id: z.string().optional(),
    opportunityId: z.string().min(1).optional(),
    ticketId: z.string().min(1).optional(),
    dailyHours: dailyHoursSchema,
    dailyComments: dailyCommentsSchema.optional(),
    billable: z.boolean().optional(),
  })
  .refine((row) => !(row.opportunityId && row.ticketId), {
    message: "Each entry must target either a ticket or an opportunity, not both",
  });

export type TimesheetEntryInput = z.infer<typeof timesheetEntryInputSchema>;

export function sumDailyHours(hours: DailyHours | null | undefined): number {
  if (!hours || typeof hours !== "object") return 0;
  return Object.entries(hours).reduce(
    (sum, [key, value]) => (isDayKey(key) ? sum + (Number(value) || 0) : sum),
    0,
  );
}

export function mergeDailyHours(entries: DailyHours[]): DailyHours {
  const merged: DailyHours = {};
  for (const row of entries) {
    for (const [key, value] of Object.entries(row ?? {})) {
      const hours = Number(value) || 0;
      if (!isDayKey(key) || hours <= 0) continue;
      merged[key] = (merged[key] ?? 0) + hours;
    }
  }
  return merged;
}

function addUtcDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Hours per calendar day for either layout (weekday keys are offset from the timesheet's Monday). */
export function hoursByIsoDay(
  startDate: Date | string,
  hours: DailyHours | null | undefined,
): Array<{ iso: string; hours: number }> {
  if (!hours || typeof hours !== "object") return [];
  const startIso = (typeof startDate === "string" ? new Date(startDate) : startDate).toISOString().slice(0, 10);
  const out: Array<{ iso: string; hours: number }> = [];
  for (const [key, value] of Object.entries(hours)) {
    const n = Number(value) || 0;
    if (n <= 0) continue;
    if (isIsoDayKey(key)) {
      out.push({ iso: key, hours: n });
      continue;
    }
    const index = (WEEKDAY_KEYS as readonly string[]).indexOf(key);
    if (index >= 0) out.push({ iso: addUtcDaysIso(startIso, index), hours: n });
  }
  return out;
}

/** Sum hours per ISO day across several entry rows. */
export function totalHoursByIsoDay(
  startDate: Date | string,
  rows: Array<DailyHours | null | undefined>,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    for (const { iso, hours } of hoursByIsoDay(startDate, row)) {
      totals.set(iso, (totals.get(iso) ?? 0) + hours);
    }
  }
  return totals;
}

export function entryHasHours(hours: DailyHours): boolean {
  return sumDailyHours(hours) > 0;
}

export function entryLabel(row: {
  ticket?: { ticketNumber: string; subject: string } | null;
  opportunity?: { name: string } | null;
  project?: { projectNumber: string; title: string } | null;
}): string {
  if (row.ticket) return `${row.ticket.ticketNumber} — ${row.ticket.subject}`;
  if (row.opportunity) return row.opportunity.name;
  if (row.project?.projectNumber && row.project?.title) {
    return `${row.project.projectNumber} — ${row.project.title}`;
  }
  if (row.project?.title) return row.project.title;
  return "Project time";
}

export function activeEntryRows(entries: TimesheetEntryInput[] | undefined): TimesheetEntryInput[] {
  return (entries ?? []).filter((row) => entryHasHours(row.dailyHours));
}

export function resolveTimesheetTargets(data: {
  projectId?: string;
  opportunityId?: string;
  ticketId?: string;
  entries?: TimesheetEntryInput[];
  dailyHours?: DailyHours;
  dailyComments?: DailyComments;
}) {
  const entryRows = activeEntryRows(data.entries);
  if (entryRows.length > 0) {
    if (!data.projectId) {
      throw new Error("PROJECT_REQUIRED");
    }
    return {
      projectId: data.projectId,
      opportunityId: null as string | null,
      ticketId: null as string | null,
      dailyHours: mergeDailyHours(entryRows.map((row) => row.dailyHours)),
      dailyComments: null,
      entryRows,
    };
  }
  return {
    projectId: data.projectId ?? null,
    opportunityId: data.opportunityId ?? null,
    ticketId: data.ticketId ?? null,
    dailyHours: data.dailyHours,
    dailyComments: data.dailyComments ?? null,
    entryRows: [] as TimesheetEntryInput[],
  };
}

export async function assertValidTimesheetEntries(
  actorId: string,
  projectId: string,
  entries: TimesheetEntryInput[],
) {
  for (const entry of entries) {
    if (!entryHasHours(entry.dailyHours)) continue;
    if (entry.ticketId && entry.opportunityId) {
      throw new Error("ENTRY_TARGET_CONFLICT");
    }
    if (entry.ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: entry.ticketId },
        select: { projectId: true },
      });
      if (!ticket?.projectId || ticket.projectId !== projectId) {
        throw new Error("INVALID_ENTRY_TICKET");
      }
    }
    if (entry.opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: entry.opportunityId },
        select: { active: true, ownerId: true },
      });
      if (!opportunity?.active || opportunity.ownerId !== actorId) {
        throw new Error("INVALID_ENTRY_OPPORTUNITY");
      }
    }
  }
}

export async function replaceTimesheetEntries(
  tx: Prisma.TransactionClient,
  timesheetId: string,
  entries: TimesheetEntryInput[],
) {
  await tx.timesheetEntry.deleteMany({ where: { timesheetId } });
  let sortOrder = 0;
  for (const entry of entries) {
    if (!entryHasHours(entry.dailyHours)) continue;
    await tx.timesheetEntry.create({
      data: {
        timesheetId,
        sortOrder,
        opportunityId: entry.opportunityId ?? null,
        ticketId: entry.ticketId ?? null,
        dailyHours: entry.dailyHours,
        dailyComments: entry.dailyComments ?? undefined,
        billable: entry.billable ?? true,
      },
    });
    sortOrder += 1;
  }
}
