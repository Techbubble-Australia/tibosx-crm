import { prisma, type Prisma } from "@techbubble/database";
import { isIsoDayKey, WEEKDAY_KEYS } from "./timesheet-entries";
import { monthBounds } from "./timesheet-monthly";
import { syncProjectActualsFromTimesheets } from "./project-financials";

/** Least-advanced status wins when weeks with different statuses merge into one month. */
const STATUS_RANK: Record<string, number> = { DRAFT: 0, SUBMITTED: 1, APPROVED: 2 };

const sourceInclude = {
  entries: { orderBy: { sortOrder: "asc" as const } },
  activityLogs: { orderBy: { createdAt: "asc" as const } },
  ticket: { select: { projectId: true } },
} satisfies Prisma.TimesheetInclude;

type SourceSheet = Prisma.TimesheetGetPayload<{ include: typeof sourceInclude }>;

type MergedEntry = {
  ticketId: string | null;
  opportunityId: string | null;
  billable: boolean;
  hours: Map<string, number>;
  comments: Map<string, string>;
};

type MonthGroup = {
  key: string;
  memberUserId: string;
  projectId: string | null;
  opportunityId: string | null;
  monthKey: string;
  sources: SourceSheet[];
  entries: Map<string, MergedEntry>;
};

export type TimesheetConversionSummary = {
  weeklySheets: number;
  monthlySheets: number;
  months: Array<{
    memberUserId: string;
    projectId: string | null;
    month: string;
    status: string;
    sourceCount: number;
    hours: number;
  }>;
};

function isoFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoFromUtc(d);
}

/** Weekday keys (mon–sun, offset from the sheet's Monday) or ISO keys → ISO date map. */
function byIsoDay<T>(startIso: string, values: unknown): Map<string, T> {
  const out = new Map<string, T>();
  if (!values || typeof values !== "object") return out;
  for (const [key, value] of Object.entries(values as Record<string, T>)) {
    if (value === undefined || value === null) continue;
    if (isIsoDayKey(key)) out.set(key, value);
    else {
      const index = (WEEKDAY_KEYS as readonly string[]).indexOf(key);
      if (index >= 0) out.set(addDaysIso(startIso, index), value);
    }
  }
  return out;
}

function sheetEntries(sheet: SourceSheet) {
  if (sheet.entries.length) return sheet.entries;
  // Legacy single-target sheets stored hours on the timesheet itself.
  return [
    {
      ticketId: sheet.projectId ? null : sheet.ticketId,
      opportunityId: sheet.projectId ? null : sheet.opportunityId,
      billable: true,
      dailyHours: sheet.dailyHours,
      dailyComments: sheet.dailyComments,
    },
  ];
}

function effectiveProjectId(sheet: SourceSheet): string | null {
  return sheet.projectId ?? sheet.ticket?.projectId ?? null;
}

function pairKey(sheet: SourceSheet): string {
  const projectId = effectiveProjectId(sheet);
  return `${sheet.memberUserId}|${projectId ?? `opp:${sheet.opportunityId ?? "none"}`}`;
}

function buildGroups(sheets: SourceSheet[]): Map<string, MonthGroup> {
  const groups = new Map<string, MonthGroup>();
  for (const sheet of sheets) {
    const startIso = isoFromUtc(sheet.startDate);
    const projectId = effectiveProjectId(sheet);
    const touched = new Set<string>();
    /** A sheet only counts toward a month's status when it logged hours in that month. */
    const group = (monthKey: string, countsAsSource: boolean) => {
      const key = `${pairKey(sheet)}|${monthKey}`;
      let g = groups.get(key);
      if (!g) {
        g = {
          key,
          memberUserId: sheet.memberUserId,
          projectId,
          opportunityId: projectId ? null : sheet.opportunityId,
          monthKey,
          sources: [],
          entries: new Map(),
        };
        groups.set(key, g);
      }
      if (countsAsSource && !g.sources.includes(sheet)) g.sources.push(sheet);
      return g;
    };

    for (const entry of sheetEntries(sheet)) {
      const hours = byIsoDay<number>(startIso, entry.dailyHours);
      const comments = byIsoDay<string>(startIso, entry.dailyComments);
      const ticketId = entry.ticketId ?? (!sheet.projectId && sheet.ticketId ? sheet.ticketId : null);
      const opportunityId = entry.opportunityId ?? null;
      const targetKey = `${ticketId ?? ""}|${opportunityId ?? ""}|${entry.billable}`;
      const days = new Set([...hours.keys(), ...comments.keys()]);
      for (const iso of days) {
        const h = Number(hours.get(iso)) || 0;
        const c = String(comments.get(iso) ?? "").trim();
        if (h <= 0 && !c) continue;
        const monthKey = iso.slice(0, 7);
        if (h > 0) touched.add(monthKey);
        const g = group(monthKey, h > 0);
        let merged = g.entries.get(targetKey);
        if (!merged) {
          merged = { ticketId, opportunityId, billable: entry.billable, hours: new Map(), comments: new Map() };
          g.entries.set(targetKey, merged);
        }
        if (h > 0) merged.hours.set(iso, (merged.hours.get(iso) ?? 0) + h);
        if (c) {
          const prev = merged.comments.get(iso);
          merged.comments.set(iso, prev && prev !== c ? `${prev}\n${c}` : c);
        }
      }
    }
    // A sheet with no hours (files / comments only) still becomes part of its starting month.
    if (!touched.size) group(startIso.slice(0, 7), true);
  }
  // Months that only received comment spill-over from a neighbouring week are not created.
  for (const g of [...groups.values()]) {
    if (!g.sources.length) groups.delete(g.key);
  }
  return groups;
}

function mergedStatus(sources: SourceSheet[]): string {
  return sources.reduce(
    (worst, s) => ((STATUS_RANK[s.status] ?? 0) < (STATUS_RANK[worst] ?? 0) ? s.status : worst),
    "APPROVED",
  );
}

function latest<T extends { startDate: Date }>(rows: T[]): T {
  return [...rows].sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0]!;
}

function stringList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
}

function groupHours(g: MonthGroup): number {
  let total = 0;
  for (const e of g.entries.values()) for (const h of e.hours.values()) total += h;
  return Math.round(total * 100) / 100;
}

async function writeGroup(tx: Prisma.TransactionClient, g: MonthGroup) {
  const { startIso, endIso } = monthBounds(g.monthKey);
  const status = mergedStatus(g.sources);
  const approverSource = latest(g.sources);
  const draftWithReason = g.sources
    .filter((s) => s.status === "DRAFT" && s.rejectReason)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  const comments = [...new Set(g.sources.map((s) => s.comments?.trim()).filter((c): c is string => Boolean(c)))];
  const fileUrls = [...new Set(g.sources.flatMap((s) => stringList(s.fileUrls)))];
  const daysOff = [
    ...new Set(
      g.sources.flatMap((s) => stringList(s.daysOff)).filter((iso) => iso.startsWith(g.monthKey)),
    ),
  ].sort();

  const created = await tx.timesheet.create({
    data: {
      projectId: g.projectId,
      opportunityId: g.opportunityId,
      memberUserId: g.memberUserId,
      startDate: new Date(`${startIso}T00:00:00.000Z`),
      endDate: new Date(`${endIso}T00:00:00.000Z`),
      period: "MONTHLY",
      daysOff,
      status,
      approverKind: approverSource.approverKind,
      projectClientContactId: approverSource.projectClientContactId,
      fileUrls,
      rejectReason: status === "DRAFT" ? (draftWithReason?.rejectReason ?? null) : null,
      comments: comments.length ? comments.join("\n\n") : null,
      createdAt: new Date(Math.min(...g.sources.map((s) => s.createdAt.getTime()))),
    },
  });

  let sortOrder = 0;
  for (const entry of g.entries.values()) {
    if (!entry.hours.size) continue;
    await tx.timesheetEntry.create({
      data: {
        timesheetId: created.id,
        sortOrder: sortOrder++,
        ticketId: entry.ticketId,
        opportunityId: entry.opportunityId,
        billable: entry.billable,
        dailyHours: Object.fromEntries([...entry.hours].sort()),
        dailyComments: Object.fromEntries([...entry.comments].sort()),
      },
    });
  }

  const logs = g.sources.flatMap((s) => s.activityLogs);
  if (logs.length) {
    await tx.timesheetActivityLog.createMany({
      data: logs.map((log) => ({
        timesheetId: created.id,
        action: log.action,
        reason: log.reason,
        performedById: log.performedById,
        createdAt: log.createdAt,
      })),
    });
  }
  const weeks = g.sources.filter((s) => s.period !== "MONTHLY").length;
  await tx.timesheetActivityLog.create({
    data: {
      timesheetId: created.id,
      action: "CONVERTED_TO_MONTHLY",
      reason: `Merged from ${weeks} weekly timesheet${weeks === 1 ? "" : "s"} (${g.sources
        .map((s) => `${isoFromUtc(s.startDate)} ${s.status.toLowerCase()}`)
        .join(", ")}).`,
    },
  });
  return { status, hours: groupHours(g) };
}

/**
 * One-time conversion of every weekly timesheet into monthly timesheets: hours are re-keyed by date,
 * weeks spanning two months are split, and each member/project/month becomes a single sheet.
 * Existing monthly sheets for an affected month are merged in. Idempotent: no weekly rows → no-op.
 */
class RehearsalRollback extends Error {
  constructor(readonly summary: TimesheetConversionSummary) {
    super("rehearsal rollback");
  }
}

export async function convertWeeklyTimesheetsToMonthly(
  options: { dryRun?: boolean; rehearse?: boolean } = {},
): Promise<TimesheetConversionSummary | null> {
  if (options.rehearse) {
    try {
      await runConversion({ dryRun: false, rehearse: true });
    } catch (error) {
      if (error instanceof RehearsalRollback) return error.summary;
      throw error;
    }
    return null;
  }
  return runConversion(options);
}

async function runConversion(
  options: { dryRun?: boolean; rehearse?: boolean },
): Promise<TimesheetConversionSummary | null> {
  const summary = await prisma.$transaction(
    async (tx) => {
      const lockRows = await tx.$queryRaw<Array<{ locked: boolean }>>`
        SELECT pg_try_advisory_xact_lock(hashtext('timesheet-weekly-to-monthly')) AS locked`;
      if (!lockRows[0]?.locked) return null;

      const weekly = await tx.timesheet.findMany({ where: { period: { not: "MONTHLY" } }, include: sourceInclude });
      if (!weekly.length) return { weeklySheets: 0, monthlySheets: 0, months: [] } as TimesheetConversionSummary;

      const members = [...new Set(weekly.map((s) => s.memberUserId))];
      const monthly = await tx.timesheet.findMany({
        where: { period: "MONTHLY", memberUserId: { in: members } },
        include: sourceInclude,
      });
      const weeklyGroups = buildGroups(weekly);
      const affectedMonths = new Set(weeklyGroups.keys());
      const monthlyToMerge = monthly.filter((s) =>
        affectedMonths.has(`${pairKey(s)}|${isoFromUtc(s.startDate).slice(0, 7)}`),
      );
      const groups = buildGroups([...weekly, ...monthlyToMerge]);

      const result: TimesheetConversionSummary = { weeklySheets: weekly.length, monthlySheets: groups.size, months: [] };
      for (const g of groups.values()) {
        const row = options.dryRun
          ? { status: mergedStatus(g.sources), hours: groupHours(g) }
          : await writeGroup(tx, g);
        result.months.push({
          memberUserId: g.memberUserId,
          projectId: g.projectId,
          month: g.monthKey,
          status: row.status,
          sourceCount: g.sources.length,
          hours: row.hours,
        });
      }
      if (!options.dryRun) {
        await tx.timesheet.deleteMany({
          where: { id: { in: [...weekly, ...monthlyToMerge].map((s) => s.id) } },
        });
      }
      if (options.rehearse) {
        // Read back what was written, then roll the whole transaction back.
        const remainingWeekly = await tx.timesheet.count({ where: { period: { not: "MONTHLY" } } });
        const written = await tx.timesheet.findMany({
          where: { period: "MONTHLY", memberUserId: { in: members } },
          select: { startDate: true, endDate: true, entries: { select: { dailyHours: true } }, _count: { select: { activityLogs: true } } },
        });
        const writtenHours = written.reduce(
          (sum, s) => sum + s.entries.reduce((h, e) => h + Object.values((e.dailyHours ?? {}) as Record<string, number>).reduce((a, b) => a + (Number(b) || 0), 0), 0),
          0,
        );
        console.log(
          `Rehearsal: ${written.length} monthly sheets written, ${remainingWeekly} weekly left, ${writtenHours} hours, ` +
            `all start on the 1st: ${written.every((s) => s.startDate.getUTCDate() === 1)}, ` +
            `every sheet has history: ${written.every((s) => s._count.activityLogs > 0)}`,
        );
        throw new RehearsalRollback(result);
      }
      return result;
    },
    { timeout: 300_000, maxWait: 20_000 },
  );

  if (summary && !options.dryRun && summary.weeklySheets > 0) {
    const projectIds = [...new Set(summary.months.map((m) => m.projectId).filter((id): id is string => Boolean(id)))];
    for (const projectId of projectIds) {
      try {
        await syncProjectActualsFromTimesheets(projectId);
      } catch (error) {
        console.error(`Failed to resync actuals for project ${projectId} after timesheet conversion:`, error);
      }
    }
  }
  return summary;
}

/** Runs once at API start; safe with several instances (transaction-scoped advisory lock). */
export async function runTimesheetConversionOnStartup() {
  try {
    const summary = await convertWeeklyTimesheetsToMonthly();
    if (summary && summary.weeklySheets > 0) {
      console.log(
        `🗓️  Converted ${summary.weeklySheets} weekly timesheets into ${summary.monthlySheets} monthly timesheets`,
      );
    }
  } catch (error) {
    console.error("Weekly → monthly timesheet conversion failed:", error);
  }
}
