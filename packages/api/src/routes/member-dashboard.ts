import { Router, type IRouter } from "express";
import { prisma, type Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { getActorId } from "../lib/project-access";
import { effectiveRolesForUser } from "../lib/admin-roles";
import { getMemberOnboardingStatus } from "../lib/member-onboarding";
import { mondayOfWeek, startOfUtcDay } from "../lib/project-types";
import { sumDailyHours, totalHoursByIsoDay, type DailyHours } from "../lib/timesheet-entries";

const router: IRouter = Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_WEEKS = 8;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type SheetHours = { startDate: Date; dailyHours: unknown; entries: Array<{ dailyHours: unknown }> };

function hourSources(sheet: SheetHours): DailyHours[] {
  return sheet.entries.length
    ? sheet.entries.map((row) => (row.dailyHours ?? {}) as DailyHours)
    : [(sheet.dailyHours ?? {}) as DailyHours];
}

function totalHours(sheet: SheetHours): number {
  return hourSources(sheet).reduce((sum, row) => sum + sumDailyHours(row), 0);
}

/** Hours on each calendar day of the timesheet (weekly or monthly). */
function hoursByDay(sheet: SheetHours): Array<{ date: Date; hours: number }> {
  return [...totalHoursByIsoDay(startOfUtcDay(sheet.startDate), hourSources(sheet))].map(([iso, hours]) => ({
    date: new Date(`${iso}T00:00:00.000Z`),
    hours,
  }));
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });
}

function periodText(sheet: { startDate: Date; period: string }): string {
  return sheet.period === "MONTHLY" ? monthLabel(sheet.startDate) : `week of ${isoDay(sheet.startDate)}`;
}

function projectLabel(project: { projectNumber: string; title: string } | null | undefined): string {
  return project ? `${project.projectNumber} · ${project.title}` : "Project";
}

type WeekStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "NOT_STARTED" | "MISSING";

/** Client and support-portal-only users have their own portal dashboard. */
const PORTAL_ONLY_ROLES = new Set(["client", "customer_support"]);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);
    if (!actorId) return res.status(401).json({ error: "Unauthorized" });
    const roles = await effectiveRolesForUser(actorId, req.user?.role ?? "");
    if (req.user?.role === "client" || roles.every((role) => PORTAL_ONLY_ROLES.has(role))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const today = startOfUtcDay(new Date());
    const currentMonday = mondayOfWeek(today);
    const lastMonday = addDays(currentMonday, -7);
    const chartStart = addDays(currentMonday, -7 * (CHART_WEEKS - 1));
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
    const lastMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const sheetsFrom = addDays(chartStart < lastMonthStart ? chartStart : lastMonthStart, -6);

    const projectSelect = {
      id: true,
      projectNumber: true,
      title: true,
      status: true,
      startDate: true,
      endDate: true,
      timesheetPeriod: true,
      client: { select: { name: true } },
      projectManager: { select: { name: true, email: true } },
    } satisfies Prisma.ProjectSelect;

    const sheetSelect = {
      id: true,
      projectId: true,
      startDate: true,
      endDate: true,
      period: true,
      status: true,
      rejectReason: true,
      dailyHours: true,
      updatedAt: true,
      entries: { select: { dailyHours: true } },
      project: { select: { projectNumber: true, title: true } },
    } satisfies Prisma.TimesheetSelect;

    const [user, onboarding, memberships, recentSheets, openSheets, activity] = await Promise.all([
      prisma.adminUser.findUnique({ where: { id: actorId }, select: { name: true, email: true } }),
      getMemberOnboardingStatus(actorId),
      prisma.projectMember.findMany({
        where: { adminUserId: actorId },
        select: { project: { select: projectSelect } },
      }),
      prisma.timesheet.findMany({
        where: { memberUserId: actorId, startDate: { gte: sheetsFrom } },
        select: sheetSelect,
      }),
      prisma.timesheet.findMany({
        where: {
          memberUserId: actorId,
          OR: [{ status: "SUBMITTED" }, { status: "DRAFT" }],
        },
        orderBy: { startDate: "asc" },
        select: sheetSelect,
      }),
      prisma.timesheetActivityLog.findMany({
        where: { timesheet: { memberUserId: actorId }, action: { in: ["SUBMITTED", "APPROVED", "REJECTED"] } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          action: true,
          reason: true,
          createdAt: true,
          performedBy: { select: { name: true, email: true } },
          timesheet: {
            select: { id: true, startDate: true, endDate: true, project: { select: { projectNumber: true, title: true } } },
          },
        },
      }),
    ]);

    const projects = memberships
      .map((row) => row.project)
      .filter((project) => project.status !== "CANCELLED")
      .sort((a, b) => a.projectNumber.localeCompare(b.projectNumber));
    const activeProjects = projects.filter((project) => project.status === "ACTIVE");

    const weekRows = (monday: Date, ended: boolean) => {
      const sunday = addDays(monday, 6);
      const key = isoDay(monday);
      return activeProjects
        .filter((project) => project.timesheetPeriod !== "MONTHLY")
        .filter((project) => project.startDate <= sunday && project.endDate >= monday)
        .map((project) => {
          const sheet = recentSheets.find((row) => row.projectId === project.id && isoDay(row.startDate) === key);
          const status: WeekStatus = sheet
            ? (sheet.status as WeekStatus)
            : ended
              ? "MISSING"
              : "NOT_STARTED";
          return {
            projectId: project.id,
            projectLabel: projectLabel(project),
            status,
            hours: sheet ? totalHours(sheet) : 0,
            timesheetId: sheet?.id ?? null,
            rejectReason: sheet?.status === "DRAFT" ? sheet.rejectReason : null,
          };
        });
    };
    const thisWeek = weekRows(currentMonday, false);
    const lastWeek = weekRows(lastMonday, true);

    const returned = openSheets.filter((row) => row.status === "DRAFT" && row.rejectReason);
    const overdueDrafts = openSheets.filter(
      (row) => row.status === "DRAFT" && !row.rejectReason && row.endDate < currentMonday,
    );
    const awaiting = openSheets.filter((row) => row.status === "SUBMITTED");

    const isMember = memberships.length > 0;
    const agreementPending = isMember && onboarding.hasAgreementAssignment && !onboarding.agreementSigned;
    const profilePending = isMember && !onboarding.profileComplete;

    const actionItems: Array<{
      id: string;
      kind: "AGREEMENT" | "PROFILE" | "RETURNED" | "OVERDUE_DRAFT" | "MISSING";
      title: string;
      detail: string;
      href: string;
    }> = [];
    if (agreementPending) {
      actionItems.push({
        id: "agreement",
        kind: "AGREEMENT",
        title: "Sign your agreement",
        detail: "You can't submit timesheets until your agreement is signed.",
        href: "/agreement",
      });
    }
    if (profilePending) {
      actionItems.push({
        id: "profile",
        kind: "PROFILE",
        title: "Complete your profile",
        detail: "Add your address, bank details and an emergency contact.",
        href: "/settings/profile",
      });
    }
    for (const row of returned) {
      actionItems.push({
        id: `returned:${row.id}`,
        kind: "RETURNED",
        title: "Timesheet returned",
        detail: `${projectLabel(row.project)}, ${periodText(row)}: ${row.rejectReason}`,
        href: `/timesheets/${row.id}`,
      });
    }
    for (const row of overdueDrafts) {
      actionItems.push({
        id: `draft:${row.id}`,
        kind: "OVERDUE_DRAFT",
        title: "Draft not submitted",
        detail: `${projectLabel(row.project)}, ${periodText(row)} (${totalHours(row)} h)`,
        href: `/timesheets/${row.id}`,
      });
    }
    const lastMonthKey = isoDay(lastMonthStart).slice(0, 7);
    const lastMonthEnd = addDays(monthStart, -1);
    for (const project of activeProjects) {
      if (project.timesheetPeriod !== "MONTHLY") continue;
      if (project.startDate > lastMonthEnd || project.endDate < lastMonthStart) continue;
      const hasSheet = recentSheets.some(
        (row) => row.projectId === project.id && row.period === "MONTHLY" && isoDay(row.startDate) === isoDay(lastMonthStart),
      );
      if (hasSheet) continue;
      actionItems.push({
        id: `missing:${project.id}:${lastMonthKey}`,
        kind: "MISSING",
        title: "Timesheet missing",
        detail: `${projectLabel(project)}, ${monthLabel(lastMonthStart)}`,
        href: `/timesheets/new?projectId=${encodeURIComponent(project.id)}&month=${lastMonthKey}`,
      });
    }
    for (const row of lastWeek.filter((r) => r.status === "MISSING")) {
      actionItems.push({
        id: `missing:${row.projectId}:${isoDay(lastMonday)}`,
        kind: "MISSING",
        title: "Timesheet missing",
        detail: `${row.projectLabel}, week of ${isoDay(lastMonday)}`,
        href: `/timesheets/new?projectId=${encodeURIComponent(row.projectId)}&weekStart=${isoDay(lastMonday)}`,
      });
    }

    // Bucket by calendar day so monthly timesheets spread across the weeks they cover.
    const weeklyHours = Array.from({ length: CHART_WEEKS }, (_, index) => {
      const monday = addDays(chartStart, index * 7);
      const nextMonday = addDays(monday, 7);
      const bucket = { weekStart: isoDay(monday), approved: 0, submitted: 0, draft: 0 };
      for (const sheet of recentSheets) {
        for (const day of hoursByDay(sheet)) {
          if (day.date < monday || day.date >= nextMonday) continue;
          if (sheet.status === "APPROVED") bucket.approved += day.hours;
          else if (sheet.status === "SUBMITTED") bucket.submitted += day.hours;
          else bucket.draft += day.hours;
        }
      }
      return bucket;
    });
    const nextMonday = addDays(currentMonday, 7);
    const hoursThisWeek = recentSheets.reduce(
      (sum, sheet) =>
        sum +
        hoursByDay(sheet)
          .filter((day) => day.date >= currentMonday && day.date < nextMonday)
          .reduce((s, day) => s + day.hours, 0),
      0,
    );

    let approvedHoursThisMonth = 0;
    let approvedHoursLastMonth = 0;
    const monthHoursByProject = new Map<string, number>();
    const lastMonthHoursByProject = new Map<string, number>();
    for (const sheet of recentSheets) {
      for (const day of hoursByDay(sheet)) {
        if (day.hours <= 0) continue;
        if (day.date >= lastMonthStart && day.date < monthStart) {
          if (sheet.status === "APPROVED") approvedHoursLastMonth += day.hours;
          if (sheet.projectId) {
            lastMonthHoursByProject.set(
              sheet.projectId,
              (lastMonthHoursByProject.get(sheet.projectId) ?? 0) + day.hours,
            );
          }
        }
        if (day.date < monthStart || day.date >= nextMonthStart) continue;
        if (sheet.projectId) {
          monthHoursByProject.set(sheet.projectId, (monthHoursByProject.get(sheet.projectId) ?? 0) + day.hours);
        }
        if (sheet.status === "APPROVED") approvedHoursThisMonth += day.hours;
      }
    }

    const projectRows = projects.map((project) => {
      const totalMs = Math.max(project.endDate.getTime() - project.startDate.getTime(), DAY_MS);
      const progress = Math.min(
        100,
        Math.max(0, Math.round(((today.getTime() - project.startDate.getTime()) / totalMs) * 100)),
      );
      return {
        id: project.id,
        projectNumber: project.projectNumber,
        title: project.title,
        clientName: project.client.name,
        status: project.status,
        startDate: project.startDate.toISOString(),
        endDate: project.endDate.toISOString(),
        progress,
        remainingDays: Math.ceil((startOfUtcDay(project.endDate).getTime() - today.getTime()) / DAY_MS),
        ended: project.endDate < today,
        projectManager: project.projectManager.name || project.projectManager.email,
        hoursThisMonth: monthHoursByProject.get(project.id) ?? 0,
        hoursLastMonth: lastMonthHoursByProject.get(project.id) ?? 0,
      };
    });

    res.json({
      data: {
        today: today.toISOString(),
        userName: user?.name?.trim() || user?.email || "",
        weekStart: isoDay(currentMonday),
        weekEnd: isoDay(addDays(currentMonday, 6)),
        lastWeekStart: isoDay(lastMonday),
        lastWeekEnd: isoDay(addDays(lastMonday, 6)),
        isProjectMember: isMember,
        onboarding: {
          agreementPending,
          profilePending,
        },
        kpis: {
          hoursThisWeek,
          awaitingApproval: { count: awaiting.length, hours: awaiting.reduce((sum, row) => sum + totalHours(row), 0) },
          approvedHoursThisMonth,
          approvedHoursLastMonth,
          lastMonthLabel: lastMonthStart.toISOString(),
          activeProjects: activeProjects.length,
        },
        actionItems,
        thisWeek,
        lastWeek,
        weeklyHours,
        projects: projectRows,
        recentActivity: activity.map((row) => ({
          id: row.id,
          action: row.action,
          reason: row.reason,
          createdAt: row.createdAt.toISOString(),
          performedBy: row.performedBy?.name || row.performedBy?.email || "",
          timesheetId: row.timesheet.id,
          projectLabel: projectLabel(row.timesheet.project),
          weekStart: isoDay(row.timesheet.startDate),
          weekEnd: isoDay(row.timesheet.endDate),
        })),
      },
    });
  } catch (error) {
    console.error("Error building member dashboard:", error);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export { router as memberDashboardRoutes };
