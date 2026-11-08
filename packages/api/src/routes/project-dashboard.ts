import { Router, type IRouter } from "express";
import { prisma, type Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { canManageProjects, getActorId } from "../lib/project-access";
import { effectiveRolesForUser } from "../lib/admin-roles";
import { toNumber } from "../lib/decimal";
import { mondayOfWeek, startOfUtcDay } from "../lib/project-types";
import { sumDailyHours, type DailyHours } from "../lib/timesheet-entries";
import {
  convertCurrency,
  DASHBOARD_BASE_CURRENCIES,
  getExchangeRatesFromBase,
  type DashboardBaseCurrency,
} from "../lib/exchange-rates";

const router: IRouter = Router();

const DAY_MS = 24 * 60 * 60 * 1000;

function parseBaseCurrency(value: unknown): DashboardBaseCurrency {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return DASHBOARD_BASE_CURRENCIES.includes(normalized as DashboardBaseCurrency)
    ? (normalized as DashboardBaseCurrency)
    : "AUD";
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function timesheetHours(row: { dailyHours: unknown; entries: Array<{ dailyHours: unknown }> }): number {
  if (row.entries.length) {
    return row.entries.reduce((sum, entry) => sum + sumDailyHours((entry.dailyHours ?? {}) as DailyHours), 0);
  }
  return sumDailyHours((row.dailyHours ?? {}) as DailyHours);
}

function projectLabel(project: { projectNumber: string; title: string }): string {
  return `${project.projectNumber} · ${project.title}`;
}

type WeekRowStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "NOT_YET_SUBMITTED" | "MISSING";

type WeekRow = {
  weekStart: string;
  weekEnd: string;
  projectId: string;
  projectLabel: string;
  consultant: string;
  status: WeekRowStatus;
  hours: number | null;
  timesheetId: string | null;
};

type WeekProject = {
  id: string;
  projectNumber: string;
  title: string;
  status: string;
  startDate: Date;
  endDate: Date;
  timesheetPeriod: string;
  members: Array<{
    adminUserId: string | null;
    profile: { firstName: string };
    adminUser: { name: string | null; email: string } | null;
  }>;
};

type WeekSheet = {
  id: string;
  projectId: string | null;
  memberUserId: string;
  startDate: Date;
  period: string;
  status: string;
  dailyHours: unknown;
  entries: Array<{ dailyHours: unknown }>;
  memberUser: { name: string | null; email: string };
};

type ExpectedPeriod = { start: Date; end: Date; ended: boolean };

const WEEK_STATUS_ORDER: Record<WeekRowStatus, number> = {
  MISSING: 0,
  DRAFT: 1,
  SUBMITTED: 2,
  NOT_YET_SUBMITTED: 3,
  APPROVED: 4,
};

/**
 * Every member with a login on an ACTIVE project is expected to log time for each period the project overlaps:
 * each week for weekly projects, each month for monthly projects.
 */
function buildWeekRows(
  projects: WeekProject[],
  sheets: WeekSheet[],
  weeks: Array<{ monday: Date; sunday: Date; ended: boolean }>,
  months: ExpectedPeriod[] = [],
): WeekRow[] {
  const periods = [
    ...weeks.map((week) => ({ period: "WEEKLY", start: week.monday, end: week.sunday, ended: week.ended })),
    ...months.map((month) => ({ period: "MONTHLY", ...month })),
  ];
  return sortWeekRows(periods.flatMap((p) => buildPeriodRows(projects, sheets, p)));
}

function buildPeriodRows(
  projects: WeekProject[],
  sheets: WeekSheet[],
  window: { period: string; start: Date; end: Date; ended: boolean },
): WeekRow[] {
  const projectById = new Map(projects.map((row) => [row.id, row]));
  const rows: WeekRow[] = [];
  const weekKey = isoDay(window.start);
  const weekEnd = isoDay(window.end);
  const periodOf = (period: string) => (period === "MONTHLY" ? "MONTHLY" : "WEEKLY");
  const sheetsThisWeek = sheets.filter(
    (row) => isoDay(row.startDate) === weekKey && periodOf(row.period) === window.period,
  );
  const seen = new Set<string>();

  for (const project of projects) {
    if (project.status !== "ACTIVE") continue;
    if (periodOf(project.timesheetPeriod) !== window.period) continue;
    if (project.startDate > window.end || project.endDate < window.start) continue;
    for (const member of project.members) {
      if (!member.adminUserId) continue;
      const key = `${project.id}:${member.adminUserId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const sheet = sheetsThisWeek.find(
        (row) => row.projectId === project.id && row.memberUserId === member.adminUserId,
      );
      rows.push({
        weekStart: weekKey,
        weekEnd,
        projectId: project.id,
        projectLabel: projectLabel(project),
        consultant: member.profile.firstName || member.adminUser?.name || member.adminUser?.email || "",
        status: sheet ? (sheet.status as WeekRowStatus) : window.ended ? "MISSING" : "NOT_YET_SUBMITTED",
        hours: sheet ? timesheetHours(sheet) : null,
        timesheetId: sheet?.id ?? null,
      });
    }
  }

  for (const sheet of sheetsThisWeek) {
    if (!sheet.projectId) continue;
    const key = `${sheet.projectId}:${sheet.memberUserId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const project = projectById.get(sheet.projectId);
    if (!project) continue;
    rows.push({
      weekStart: weekKey,
      weekEnd,
      projectId: project.id,
      projectLabel: projectLabel(project),
      consultant: sheet.memberUser.name?.trim() || sheet.memberUser.email,
      status: sheet.status as WeekRowStatus,
      hours: timesheetHours(sheet),
      timesheetId: sheet.id,
    });
  }
  return rows;
}

function sortWeekRows(rows: WeekRow[]): WeekRow[] {
  return rows.sort(
    (a, b) =>
      b.weekStart.localeCompare(a.weekStart) ||
      WEEK_STATUS_ORDER[a.status] - WEEK_STATUS_ORDER[b.status] ||
      a.projectLabel.localeCompare(b.projectLabel),
  );
}

const weekProjectMembersSelect = {
  orderBy: { createdAt: "asc" },
  select: {
    adminUserId: true,
    profile: { select: { firstName: true } },
    adminUser: { select: { name: true, email: true } },
  },
} satisfies Prisma.Project$membersArgs;

const weekSheetSelect = {
  id: true,
  projectId: true,
  memberUserId: true,
  startDate: true,
  period: true,
  status: true,
  dailyHours: true,
  entries: { select: { dailyHours: true } },
  memberUser: { select: { name: true, email: true } },
} satisfies Prisma.TimesheetSelect;

async function requireProjectManager(req: AuthRequest): Promise<string | null> {
  const actorId = getActorId(req);
  const roles = await effectiveRolesForUser(actorId, req.user?.role ?? "");
  return roles.some((role) => canManageProjects(role)) ? actorId : null;
}

function scopeWhere(mine: boolean, actorId: string): Prisma.ProjectWhereInput {
  return mine ? { OR: [{ projectManagerId: actorId }, { timesheetApproverUserId: actorId }] } : {};
}

/** Timesheets for every week that overlaps the requested month (YYYY-MM, default current month). */
router.get("/timesheets-by-month", async (req: AuthRequest, res) => {
  try {
    const actorId = await requireProjectManager(req);
    if (!actorId) return res.status(403).json({ error: "Forbidden" });

    const today = startOfUtcDay(new Date());
    const match = typeof req.query.month === "string" ? /^(\d{4})-(\d{2})$/.exec(req.query.month) : null;
    const year = match ? Number(match[1]) : today.getUTCFullYear();
    const month = match ? Number(match[2]) - 1 : today.getUTCMonth();
    if (month < 0 || month > 11) return res.status(400).json({ error: "Invalid month" });

    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 0));
    const weeks: Array<{ monday: Date; sunday: Date; ended: boolean }> = [];
    for (let monday = mondayOfWeek(monthStart); monday <= monthEnd; monday = addDays(monday, 7)) {
      const sunday = addDays(monday, 6);
      weeks.push({ monday, sunday, ended: sunday < today });
    }

    const projects = await prisma.project.findMany({
      where: scopeWhere(req.query.scope === "mine", actorId),
      orderBy: { projectNumber: "asc" },
      select: {
        id: true,
        projectNumber: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        timesheetPeriod: true,
        members: weekProjectMembersSelect,
      },
    });
    const sheets = projects.length
      ? await prisma.timesheet.findMany({
          where: {
            projectId: { in: projects.map((row) => row.id) },
            startDate: { gte: weeks[0]!.monday, lt: addDays(weeks[weeks.length - 1]!.monday, 7) },
          },
          select: weekSheetSelect,
        })
      : [];

    res.json({
      data: {
        month: `${year}-${String(month + 1).padStart(2, "0")}`,
        rows: buildWeekRows(projects, sheets, weeks, [
          { start: monthStart, end: monthEnd, ended: monthEnd < today },
        ]),
      },
    });
  } catch (error) {
    console.error("Error loading timesheets by month:", error);
    res.status(500).json({ error: "Failed to load timesheets" });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const actorId = await requireProjectManager(req);
    if (!actorId) return res.status(403).json({ error: "Forbidden" });

    const mine = req.query.scope === "mine";
    const baseCurrency = parseBaseCurrency(req.query.baseCurrency);
    const rates = await getExchangeRatesFromBase(baseCurrency);
    const toBase = (amount: number, from: string) =>
      convertCurrency(amount, from || baseCurrency, baseCurrency, baseCurrency, rates);

    const today = startOfUtcDay(new Date());
    const currentMonday = mondayOfWeek(today);
    const lastMonday = addDays(currentMonday, -7);
    const lastSunday = addDays(lastMonday, 6);

    const projects = await prisma.project.findMany({
      where: scopeWhere(mine, actorId),
      orderBy: { projectNumber: "asc" },
      select: {
        id: true,
        projectNumber: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        timesheetPeriod: true,
        client: { select: { name: true } },
        projectManager: { select: { name: true, email: true } },
        timesheetApprover: { select: { name: true, email: true } },
        members: weekProjectMembersSelect,
        estimates: { select: { year: true, month: true, qty: true, currency: true, estimatedCost: true, costType: true } },
        actuals: { select: { year: true, month: true, qty: true, currency: true, actualCost: true, costType: true } },
      },
    });
    const projectIds = projects.map((row) => row.id);
    const projectById = new Map(projects.map((row) => [row.id, row]));

    const timesheetSelect = {
      id: true,
      projectId: true,
      memberUserId: true,
      startDate: true,
      endDate: true,
      status: true,
      approverKind: true,
      dailyHours: true,
      entries: { select: { dailyHours: true } },
      memberUser: { select: { name: true, email: true } },
      projectClientContact: { select: { contact: { select: { name: true } } } },
    } satisfies Prisma.TimesheetSelect;

    const lastMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const lastMonthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));

    const [pendingTimesheets, lastWeekTimesheets, lastMonthTimesheets] = projectIds.length
      ? await Promise.all([
          prisma.timesheet.findMany({
            where: {
              projectId: { in: projectIds },
              OR: [{ status: "SUBMITTED" }, { status: "DRAFT", endDate: { lt: currentMonday } }],
            },
            orderBy: { startDate: "asc" },
            select: timesheetSelect,
          }),
          prisma.timesheet.findMany({
            where: { projectId: { in: projectIds }, startDate: { gte: lastMonday, lt: currentMonday } },
            select: weekSheetSelect,
          }),
          prisma.timesheet.findMany({
            where: { projectId: { in: projectIds }, period: "MONTHLY", startDate: lastMonthStart },
            select: weekSheetSelect,
          }),
        ])
      : [[], [], []];

    const memberName = (
      sheet: { memberUser: { name: string | null; email: string } },
    ) => sheet.memberUser.name?.trim() || sheet.memberUser.email;

    const approverName = (sheet: (typeof pendingTimesheets)[number]) => {
      if (sheet.approverKind === "CLIENT_CONTACT" && sheet.projectClientContact?.contact.name) {
        return sheet.projectClientContact.contact.name;
      }
      const project = sheet.projectId ? projectById.get(sheet.projectId) : null;
      return (
        project?.timesheetApprover?.name ||
        project?.timesheetApprover?.email ||
        project?.projectManager?.name ||
        project?.projectManager?.email ||
        ""
      );
    };

    const lastWeekRows = buildWeekRows(
      projects,
      [...lastWeekTimesheets, ...lastMonthTimesheets],
      [{ monday: lastMonday, sunday: lastSunday, ended: true }],
      [{ start: lastMonthStart, end: lastMonthEnd, ended: true }],
    );

    const submitted = pendingTimesheets.filter((row) => row.status === "SUBMITTED");
    const overdueDrafts = pendingTimesheets.filter((row) => row.status === "DRAFT");
    const missingLastWeek = lastWeekRows.filter((row) => row.status === "MISSING");
    const activeProjects = projects.filter((row) => row.status === "ACTIVE");
    const pastEnd = activeProjects.filter((row) => row.endDate < today);

    const attention = [
      ...missingLastWeek.map((row) => ({
        kind: "MISSING" as const,
        projectId: row.projectId,
        projectLabel: row.projectLabel,
        timesheetId: null,
        consultant: row.consultant,
        weekStart: row.weekStart,
        weekEnd: row.weekEnd,
        hours: null,
        approver: null,
        endDate: null,
      })),
      ...submitted.map((row) => ({
        kind: "AWAITING_APPROVAL" as const,
        projectId: row.projectId!,
        projectLabel: projectLabel(projectById.get(row.projectId!)!),
        timesheetId: row.id,
        consultant: memberName(row),
        weekStart: isoDay(row.startDate),
        weekEnd: isoDay(row.endDate),
        hours: timesheetHours(row),
        approver: approverName(row),
        endDate: null,
      })),
      ...overdueDrafts.map((row) => ({
        kind: "DRAFT_NOT_SUBMITTED" as const,
        projectId: row.projectId!,
        projectLabel: projectLabel(projectById.get(row.projectId!)!),
        timesheetId: row.id,
        consultant: memberName(row),
        weekStart: isoDay(row.startDate),
        weekEnd: isoDay(row.endDate),
        hours: timesheetHours(row),
        approver: null,
        endDate: null,
      })),
      ...pastEnd.map((row) => ({
        kind: "PAST_END_DATE" as const,
        projectId: row.id,
        projectLabel: projectLabel(row),
        timesheetId: null,
        consultant: null,
        weekStart: null,
        weekEnd: null,
        hours: null,
        approver: null,
        endDate: row.endDate.toISOString(),
      })),
    ];

    // Financials, converted to the base currency.
    const currentYm = today.getUTCFullYear() * 12 + today.getUTCMonth();
    const monthMap = new Map<
      number,
      { year: number; month: number; days: number; estimated: number; actual: number; costTypes: Set<string> }
    >();
    const monthBucket = (year: number, month: number) => {
      const key = year * 12 + month;
      let bucket = monthMap.get(key);
      if (!bucket) {
        bucket = { year, month, days: 0, estimated: 0, actual: 0, costTypes: new Set() };
        monthMap.set(key, bucket);
      }
      return bucket;
    };

    let estimatedTotal = 0;
    let estimatedBeforeThisMonth = 0;
    let actualTotal = 0;
    const actualMonths = new Set<number>();
    for (const project of projects) {
      if (project.status === "CANCELLED") continue;
      for (const row of project.estimates) {
        const amount = toBase(toNumber(row.estimatedCost), row.currency);
        estimatedTotal += amount;
        if (row.year * 12 + row.month < currentYm) estimatedBeforeThisMonth += amount;
        const bucket = monthBucket(row.year, row.month);
        bucket.estimated += amount;
        if (row.costType === "personnel") bucket.days += toNumber(row.qty);
        bucket.costTypes.add(row.costType);
      }
      for (const row of project.actuals) {
        const amount = toBase(toNumber(row.actualCost), row.currency);
        actualTotal += amount;
        actualMonths.add(row.year * 12 + row.month);
        const bucket = monthBucket(row.year, row.month);
        bucket.actual += amount;
        bucket.costTypes.add(row.costType);
      }
    }
    const costByMonth = [...monthMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, row]) => ({
        year: row.year,
        month: row.month,
        days: Math.round(row.days * 100) / 100,
        estimated: Math.round(row.estimated * 100) / 100,
        actual: Math.round(row.actual * 100) / 100,
        costTypes: [...row.costTypes],
      }));

    const projectRows = projects.map((project) => {
      const totalMs = Math.max(project.endDate.getTime() - project.startDate.getTime(), DAY_MS);
      const elapsedMs = today.getTime() - project.startDate.getTime();
      const progress = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));
      const remainingDays = Math.ceil((startOfUtcDay(project.endDate).getTime() - today.getTime()) / DAY_MS);
      return {
        id: project.id,
        projectNumber: project.projectNumber,
        title: project.title,
        clientName: project.client.name,
        consultants: project.members
          .map((m) => m.profile.firstName || m.adminUser?.name || "")
          .filter(Boolean),
        status: project.status,
        startDate: project.startDate.toISOString(),
        endDate: project.endDate.toISOString(),
        progress,
        remainingDays,
        ended: project.endDate < today,
      };
    });

    res.json({
      data: {
        today: today.toISOString(),
        baseCurrency,
        scope: mine ? "mine" : "all",
        kpis: {
          awaitingApproval: {
            count: submitted.length,
            hours: submitted.reduce((sum, row) => sum + timesheetHours(row), 0),
          },
          overdueDrafts: {
            count: overdueDrafts.length,
            hours: overdueDrafts.reduce((sum, row) => sum + timesheetHours(row), 0),
          },
          missingTimesheets: { count: missingLastWeek.length },
          activeProjects: { count: activeProjects.length, pastEndDate: pastEnd.length },
          estimatedCost: {
            total: Math.round(estimatedTotal),
            beforeThisMonth: Math.round(estimatedBeforeThisMonth),
          },
          actualCost: { total: Math.round(actualTotal), months: actualMonths.size },
        },
        attention,
        costByMonth,
        projects: projectRows,
      },
    });
  } catch (error) {
    console.error("Error building project manager dashboard:", error);
    res.status(500).json({ error: "Failed to load project dashboard" });
  }
});

export { router as projectDashboardRoutes };
