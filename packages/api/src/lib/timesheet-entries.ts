import { z } from "zod";
import { prisma, type Prisma } from "@techbubble/database";

export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];
export type DailyHours = Partial<Record<WeekdayKey, number>>;
export type DailyComments = Partial<Record<WeekdayKey, string>>;

export const dailyHoursSchema = z.object({
  mon: z.coerce.number().min(0).optional(),
  tue: z.coerce.number().min(0).optional(),
  wed: z.coerce.number().min(0).optional(),
  thu: z.coerce.number().min(0).optional(),
  fri: z.coerce.number().min(0).optional(),
  sat: z.coerce.number().min(0).optional(),
  sun: z.coerce.number().min(0).optional(),
});

export const dailyCommentsSchema = z.object({
  mon: z.string().max(2000).optional(),
  tue: z.string().max(2000).optional(),
  wed: z.string().max(2000).optional(),
  thu: z.string().max(2000).optional(),
  fri: z.string().max(2000).optional(),
  sat: z.string().max(2000).optional(),
  sun: z.string().max(2000).optional(),
});

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

export function sumDailyHours(hours: DailyHours): number {
  return WEEKDAY_KEYS.reduce((sum, key) => sum + (Number(hours[key]) || 0), 0);
}

export function mergeDailyHours(entries: DailyHours[]): DailyHours {
  const merged: DailyHours = {};
  for (const key of WEEKDAY_KEYS) {
    const total = entries.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
    if (total > 0) merged[key] = total;
  }
  return merged;
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
