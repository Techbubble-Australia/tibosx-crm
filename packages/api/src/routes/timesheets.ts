import { Router, type IRouter, type Response } from "express";
import { z } from "zod";
import { prisma, type Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import {
  canManageAllTimesheets,
  getActorId,
  isProjectManagerRole,
} from "../lib/project-access";
import {
  canActAsTimesheetApprover,
  submittedTimesheetsPendingPmApprovalWhere,
} from "../lib/timesheet-approver";
import { timesheetClientApproverWhere } from "../lib/timesheet-access";
import { effectiveRolesForUser, hasEffectiveRole } from "../lib/admin-roles";
import { getMemberOnboardingStatus } from "../lib/member-onboarding";
import { notifyAsync } from "../lib/notifications";
import { mondayOfWeek, sundayOfWeek, TIMESHEET_STATUSES, TIMESHEET_STATUS_LABELS } from "../lib/project-types";
import { buildTimesheetTemplateCsv } from "../lib/timesheet-export-template.js";
import { formatZodError } from "../lib/zod-error";
import {
  listActiveProjectMembershipsForUser,
  projectMemberWhereForUser,
  userHasActiveProjectMembership,
} from "../lib/project-member-resolution";
import {
  activeEntryRows,
  assertValidTimesheetEntries,
  dailyCommentsSchema,
  dailyHoursSchema,
  entryHasHours,
  entryLabel,
  replaceTimesheetEntries,
  resolveTimesheetTargets,
  sumDailyHours,
  timesheetEntryInputSchema,
  WEEKDAY_KEYS,
} from "../lib/timesheet-entries";
import {
  assertTimesheetWithinProjectDates,
  projectDateBoundsIso,
  projectWeekMondayBounds,
  snapWeekMondayToInput,
  weekOverlapsProjectRange,
} from "../lib/timesheet-project-dates";

const router: IRouter = Router();

const timesheetSchema = z
  .object({
    projectId: z.string().min(1).optional(),
    opportunityId: z.string().min(1).optional(),
    ticketId: z.string().min(1).optional(),
    entries: z.array(timesheetEntryInputSchema).optional(),
    approverKind: z.enum(["PM", "CLIENT_CONTACT"]).optional(),
    projectClientContactId: z.string().min(1).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    fileUrls: z.array(z.string().min(1)).optional(),
    dailyHours: dailyHoursSchema.optional(),
    dailyComments: dailyCommentsSchema.optional(),
    comments: z.string().max(10000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const entryRows = activeEntryRows(data.entries);
    if (entryRows.length > 0) {
      if (!data.projectId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a project for line entries",
          path: ["projectId"],
        });
      }
      return;
    }
    if (!data.projectId && !data.opportunityId && !data.ticketId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a project, sales case, or support case",
        path: ["projectId"],
      });
    }
    if ([data.projectId, data.opportunityId, data.ticketId].filter(Boolean).length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select only one target",
        path: ["projectId"],
      });
    }
  })
  .refine(
    (data) => {
      const entryRows = activeEntryRows(data.entries);
      const files = data.fileUrls?.length ?? 0;
      if (entryRows.length > 0) {
        return files > 0 || entryRows.some((row) => entryHasHours(row.dailyHours));
      }
      const hours = data.dailyHours ? sumDailyHours(data.dailyHours) : 0;
      return files > 0 || hours > 0;
    },
    { message: "Enter hours for the week or attach at least one file" },
  );

function serializeEntry(row: {
  id: string;
  sortOrder: number;
  opportunityId: string | null;
  ticketId: string | null;
  dailyHours: unknown;
  dailyComments: unknown;
  billable: boolean;
  opportunity?: { name: string } | null;
  ticket?: { ticketNumber: string; subject: string } | null;
  project?: { projectNumber: string; title: string } | null;
}) {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    opportunityId: row.opportunityId,
    ticketId: row.ticketId,
    label: entryLabel({
      ticket: row.ticket,
      opportunity: row.opportunity,
      project: row.project ?? null,
    }),
    dailyHours: row.dailyHours ?? null,
    dailyComments: row.dailyComments ?? null,
    billable: row.billable,
  };
}

function serializeActivity(row: {
  id: string;
  action: string;
  reason: string | null;
  createdAt: Date;
  performedBy?: { name: string | null; email: string } | null;
}) {
  return {
    id: row.id,
    action: row.action,
    reason: row.reason,
    performedByName: row.performedBy?.name || row.performedBy?.email || "",
    createdAt: row.createdAt.toISOString(),
  };
}

function resolveTimesheetApproverLabel(row: {
  approverKind: string | null;
  project?: {
    projectManager?: { name: string | null; email: string } | null;
    timesheetApprover?: { name: string | null; email: string } | null;
  } | null;
  projectClientContact?: { contact: { name: string; email: string } } | null;
}): string {
  const projectApproverName =
    row.project?.timesheetApprover?.name ||
    row.project?.timesheetApprover?.email ||
    row.project?.projectManager?.name ||
    row.project?.projectManager?.email ||
    "";
  if (row.approverKind === "CLIENT_CONTACT") {
    const raw =
      row.projectClientContact?.contact.name?.trim() ||
      row.projectClientContact?.contact.email?.trim() ||
      "";
    if (raw) return raw.replace(/\s*\(client\)\s*$/i, "").trim() || raw;
    if (projectApproverName.trim()) return projectApproverName;
    return "Client contact";
  }
  if (row.approverKind === "PM") {
    return projectApproverName || "Project manager";
  }
  return projectApproverName;
}

function serializeTimesheet(row: {
  id: string;
  projectId: string | null;
  opportunityId: string | null;
  ticketId: string | null;
  approverKind: string | null;
  projectClientContactId: string | null;
  memberUserId: string;
  startDate: Date;
  endDate: Date;
  status: string;
  fileUrls: unknown;
  dailyHours: unknown;
  dailyComments: unknown;
  rejectReason: string | null;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
    project?: {
    id: string;
    title: string;
    projectNumber: string;
    clientId?: string;
    client?: { id: string; name: string } | null;
    projectManagerId: string;
    projectManager?: { name: string | null; email: string } | null;
    timesheetApprover?: { name: string | null; email: string } | null;
  } | null;
  opportunity?: { id: string; name: string } | null;
  ticket?: { id: string; ticketNumber: string; subject: string; projectId: string | null } | null;
  projectClientContact?: { id: string; contact: { name: string; email: string } } | null;
  memberUser?: { id: string; name: string | null; email: string };
  activityLogs?: ReturnType<typeof serializeActivity>[];
  entries?: ReturnType<typeof serializeEntry>[];
}) {
  const fileUrls = Array.isArray(row.fileUrls)
    ? row.fileUrls.filter((url): url is string => typeof url === "string")
    : [];
  const status = row.status as keyof typeof TIMESHEET_STATUS_LABELS;
  const serializedEntries = row.entries ?? [];
  const multiLineLabel =
    serializedEntries.length > 0
      ? serializedEntries.length === 1
        ? serializedEntries[0]!.label
        : `${serializedEntries.length} entries — ${row.project?.projectNumber ?? ""} ${row.project?.title ?? ""}`.trim()
      : "";
  return {
    id: row.id,
    projectId: row.projectId,
    opportunityId: row.opportunityId,
    ticketId: row.ticketId,
    approverKind: row.approverKind,
    projectClientContactId: row.projectClientContactId,
    approverLabel: resolveTimesheetApproverLabel(row),
    projectTitle: row.project?.title ?? "",
    projectNumber: row.project?.projectNumber ?? "",
    clientId: row.project?.clientId ?? row.project?.client?.id ?? "",
    clientName: row.project?.client?.name ?? "",
    opportunityName: row.opportunity?.name ?? "",
    targetLabel: multiLineLabel
      ? multiLineLabel
      : row.ticket
        ? `${row.ticket.ticketNumber} — ${row.ticket.subject}`
        : row.project
          ? `${row.project.projectNumber} — ${row.project.title}`
          : row.opportunity?.name ?? "",
    entries: serializedEntries,
    memberUserId: row.memberUserId,
    memberName: row.memberUser?.name || row.memberUser?.email || "",
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    status: row.status,
    statusLabel: TIMESHEET_STATUS_LABELS[status] ?? row.status,
    fileUrls,
    dailyHours: row.dailyHours ?? null,
    dailyComments: row.dailyComments ?? null,
    rejectReason: row.rejectReason,
    comments: row.comments,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    activityLogs: row.activityLogs ?? [],
  };
}

const detailInclude = {
  project: {
    select: {
      id: true,
      title: true,
      projectNumber: true,
      projectManagerId: true,
      timesheetApproverUserId: true,
    },
  },
  opportunity: { select: { id: true, name: true, ownerId: true } },
  ticket: { select: { id: true, ticketNumber: true, subject: true, projectId: true } },
  projectClientContact: { include: { contact: { select: { name: true, email: true } } } },
  memberUser: { select: { id: true, name: true, email: true } },
  activityLogs: {
    orderBy: { createdAt: "desc" as const },
    include: { performedBy: { select: { name: true, email: true } } },
  },
  entries: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      opportunity: { select: { name: true } },
      ticket: { select: { ticketNumber: true, subject: true } },
    },
  },
};

async function fetchTimesheet(id: string) {
  return prisma.timesheet.findUnique({ where: { id }, include: detailInclude });
}

function mapDetail(row: NonNullable<Awaited<ReturnType<typeof fetchTimesheet>>>) {
  return serializeTimesheet({
    ...row,
    activityLogs: row.activityLogs.map(serializeActivity),
    entries: row.entries.map((entry) =>
      serializeEntry({ ...entry, project: row.project ?? null }),
    ),
  });
}

async function clientContactCanActOnTimesheet(
  actorId: string,
  timesheet: { approverKind: string | null; projectClientContactId: string | null },
): Promise<boolean> {
  if (timesheet.approverKind !== "CLIENT_CONTACT" || !timesheet.projectClientContactId) return false;
  const clientApprover = await timesheetClientApproverWhere(actorId);
  const ids = clientApprover?.projectClientContactId.in ?? [];
  return ids.includes(timesheet.projectClientContactId);
}

async function mapDetailWithActions(
  row: NonNullable<Awaited<ReturnType<typeof fetchTimesheet>>>,
  actorId: string,
  role: string,
) {
  const roles = await effectiveRolesForUser(actorId, role);
  let canApprove =
    row.status === "SUBMITTED" &&
    row.approverKind !== "CLIENT_CONTACT" &&
    ((row.project && canActAsTimesheetApprover(actorId, roles, row.project)) ||
      row.opportunity?.ownerId === actorId);
  if (
    !canApprove &&
    row.status === "SUBMITTED" &&
    row.approverKind === "CLIENT_CONTACT" &&
    row.projectClientContactId &&
    roles.includes("client")
  ) {
    const clientApprover = await timesheetClientApproverWhere(actorId);
    const ids = clientApprover?.projectClientContactId.in ?? [];
    canApprove = ids.includes(row.projectClientContactId);
  }
  const canSubmit = row.memberUserId === actorId && row.status === "DRAFT";
  const canDelete =
    (roles.includes("admin") && (row.status === "DRAFT" || row.status === "SUBMITTED")) ||
    (row.memberUserId === actorId && row.status === "DRAFT");
  return {
    ...mapDetail(row),
    canApprove,
    canSubmit,
    canDelete,
  };
}

const TERMINAL_TICKET_STATUSES = ["RESOLVED", "CLOSED", "CANCELLED"] as const;

const TICKET_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  PENDING_CLIENT: "Awaiting client info",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

function formatTicketStatusLabel(status: string): string {
  return TICKET_STATUS_LABELS[status] ?? status.replace(/_/g, " ").toLowerCase();
}

function endOfWeekSundayUtc(weekStartIso: string): Date {
  const sun = sundayOfWeek(new Date(`${weekStartIso}T00:00:00.000Z`));
  const end = new Date(sun);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/** Terminal tickets only appear for the week they were closed/resolved/cancelled in. */
function ticketEligibleForTimesheetWeek(
  ticket: { status: string; closedAt: Date | null; updatedAt: Date },
  weekStartIso: string | null | undefined,
): boolean {
  if (!TERMINAL_TICKET_STATUSES.includes(ticket.status as (typeof TERMINAL_TICKET_STATUSES)[number])) {
    return true;
  }
  if (!weekStartIso) return false;
  const weekStart = new Date(`${weekStartIso}T00:00:00.000Z`);
  const weekEnd = endOfWeekSundayUtc(weekStartIso);
  const terminalAt = ticket.closedAt ?? ticket.updatedAt;
  return terminalAt >= weekStart && terminalAt <= weekEnd;
}

async function listTimesheetTicketsForProject(projectId: string, weekStartIso?: string | null) {
  const supportOrg = await prisma.organization.findFirst({
    where: { projectId, active: true },
    select: { id: true },
  });
  const rows = await prisma.ticket.findMany({
    where: {
      OR: [{ projectId }, ...(supportOrg ? [{ organizationId: supportOrg.id }] : [])],
    },
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: true,
      closedAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return rows.filter((row) => ticketEligibleForTimesheetWeek(row, weekStartIso));
}

async function timesheetAccessWhere(req: AuthRequest): Promise<Prisma.TimesheetWhereInput> {
  const role = req.user?.role ?? "";
  const actorId = getActorId(req);
  const roles = await effectiveRolesForUser(actorId, role);
  if (roles.includes("admin")) {
    return {};
  }
  const or: Prisma.TimesheetWhereInput[] = [{ memberUserId: actorId }];
  if (roles.some((r) => r === "project_manager" || r === "admin")) {
    or.push(
      { project: { timesheetApproverUserId: actorId } },
      { project: { projectManagerId: actorId } },
      { opportunity: { ownerId: actorId } },
    );
  }
  if (roles.includes("client")) {
    or.push({ project: { timesheetApproverUserId: actorId } });
    const clientApprover = await timesheetClientApproverWhere(actorId);
    if (clientApprover) or.push(clientApprover);
  }
  return { OR: or };
}

async function assertMemberCanSubmitTimesheets(
  actorId: string,
  roles: string[],
  options?: { impersonatorId?: string },
) {
  if (options?.impersonatorId) return;
  if (!hasEffectiveRole(roles, "project_member")) return;
  if (roles.includes("admin") || roles.includes("project_manager")) return;
  // Profile/KYC is not required for timesheets — warn in the UI instead.
  const onboarding = await getMemberOnboardingStatus(actorId);
  if (onboarding.hasAgreementAssignment && !onboarding.agreementSigned) {
    throw new Error("AGREEMENT_REQUIRED");
  }
}

async function memberTimesheetProfileWarnings(
  actorId: string,
  roles: string[],
  impersonatorId?: string,
): Promise<string[]> {
  if (impersonatorId) return [];
  if (!hasEffectiveRole(roles, "project_member")) return [];
  if (roles.includes("admin") || roles.includes("project_manager")) return [];
  const onboarding = await getMemberOnboardingStatus(actorId);
  if (!onboarding.profileOnboardingRequired) return [];
  return [
    "Your profile is incomplete. You can continue using timesheets, but please complete your profile in Settings when you can.",
  ];
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type TimesheetEntryPoint = {
  weekStart: string;
  existingTimesheetId?: string;
};

function isLikelyTimesheetId(value: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(value);
}

async function hydrateTimesheetApproverRow<
  T extends {
    approverKind: string | null;
    projectClientContactId: string | null;
    projectId?: string | null;
    projectClientContact?: { contact: { name: string; email: string } } | null;
  },
>(row: T): Promise<T> {
  if (row.approverKind !== "CLIENT_CONTACT") return row;
  const contact = row.projectClientContact?.contact;
  if (contact?.name?.trim() || contact?.email?.trim()) return row;

  if (row.projectClientContactId) {
    const link = await prisma.projectClientContact.findUnique({
      where: { id: row.projectClientContactId },
      include: { contact: { select: { name: true, email: true } } },
    });
    if (link?.contact?.name?.trim() || link?.contact?.email?.trim()) {
      return { ...row, projectClientContact: link };
    }
  }

  if (row.projectId) {
    const fallback = await prisma.projectClientContact.findFirst({
      where: { projectId: row.projectId, canApproveTimesheets: true },
      include: { contact: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    if (fallback) return { ...row, projectClientContact: fallback };
  }

  return row;
}

async function findNextOpenTimesheetWeek(
  actorId: string,
  projectId: string,
): Promise<TimesheetEntryPoint | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { startDate: true, endDate: true, status: true },
  });
  if (!project) return null;
  const { startDate, endDate } = projectDateBoundsIso(project);
  const bounds = projectWeekMondayBounds(startDate, endDate);
  const currentMonday = snapWeekMondayToInput(new Date().toISOString());

  async function existingFor(weekStart: string) {
    return prisma.timesheet.findFirst({
      where: {
        memberUserId: actorId,
        projectId,
        startDate: new Date(`${weekStart}T00:00:00.000Z`),
      },
      select: { id: true, status: true },
    });
  }

  if (currentMonday > bounds.max) {
    const existing = await existingFor(bounds.max);
    return { weekStart: bounds.max, existingTimesheetId: existing?.id };
  }

  let monday = currentMonday < bounds.min ? bounds.min : currentMonday;
  const fallbackMonday = monday;

  for (let i = 0; i < 156; i++) {
    if (monday > bounds.max) break;
    if (!weekOverlapsProjectRange(monday, startDate, endDate)) {
      monday = addDaysIso(monday, 7);
      continue;
    }
    const existing = await existingFor(monday);
    if (!existing) return { weekStart: monday };
    if (existing.status === "DRAFT") {
      return { weekStart: monday, existingTimesheetId: existing.id };
    }
    // SUBMITTED or APPROVED — advance to the next week without an existing timesheet.
    monday = addDaysIso(monday, 7);
  }
  // Every remaining week is logged: open the current week so the member can still browse back.
  const existing = await existingFor(fallbackMonday);
  return { weekStart: fallbackMonday, existingTimesheetId: existing?.id };
}

async function resolveTimesheetEntryPoint(req: AuthRequest, res: Response) {
  const actorId = getActorId(req);
  const role = req.user?.role ?? "";
  const roles = await effectiveRolesForUser(actorId, role);
  if (!(await actorMayLogTimesheets(actorId, role))) {
    return res.status(403).json({ error: "Only project members can create timesheets" });
  }
  const preferredProjectId =
    typeof req.query.projectId === "string" ? req.query.projectId.trim() : "";
  const memberships = await listActiveProjectMembershipsForUser(actorId);
  if (!memberships.length) {
    return res.status(403).json({
      error: "You must be assigned to an active project before creating timesheets",
    });
  }
  const match =
    (preferredProjectId && memberships.find((row) => row.project.id === preferredProjectId)) ||
    memberships[0];
  const projectId = match!.project.id;
  const entry = await findNextOpenTimesheetWeek(actorId, projectId);
  if (!entry) {
    return res.status(409).json({
      error: "All timesheet weeks are already logged for your active project assignments",
    });
  }
  const mon = new Date(`${entry.weekStart}T00:00:00.000Z`);
  const sun = sundayOfWeek(mon);
  return res.json({
    data: {
      projectId,
      weekStart: entry.weekStart,
      weekEnd: sun.toISOString().slice(0, 10),
      existingTimesheetId: entry.existingTimesheetId ?? null,
    },
  });
}

/** Log/edit own timesheets: active project membership required (admin/PM included when assigned). */
async function actorMayLogTimesheets(actorId: string, role: string): Promise<boolean> {
  const memberships = await listActiveProjectMembershipsForUser(actorId);
  return memberships.length > 0;
}

router.get("/active-projects", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    const roles = await effectiveRolesForUser(actorId, role);
    const weekStart =
      typeof req.query.weekStart === "string" && req.query.weekStart.trim()
        ? req.query.weekStart.trim()
        : null;
    const projectMemberships = await listActiveProjectMembershipsForUser(actorId);
    const options: Array<{ id: string; label: string; kind: string }> = [];
    const seen = new Set<string>();

    function pushProject(project: {
      id: string;
      projectNumber: string;
      title: string;
      kind: string;
      startDate: Date;
      endDate: Date;
    }) {
      if (seen.has(project.id)) return;
      if (weekStart) {
        const { startDate, endDate } = projectDateBoundsIso(project);
        if (!weekOverlapsProjectRange(weekStart, startDate, endDate)) return;
      }
      seen.add(project.id);
      options.push({
        id: project.id,
        label: `${project.projectNumber} — ${project.title}`,
        kind: project.kind,
      });
    }

    for (const row of projectMemberships) {
      pushProject(row.project);
    }

    if (roles.includes("admin")) {
      const allActive = await prisma.project.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          projectNumber: true,
          title: true,
          kind: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { projectNumber: "asc" },
      });
      for (const project of allActive) {
        pushProject(project);
      }
    } else if (roles.some((r) => r === "project_manager" || r === "admin")) {
      const managed = await prisma.project.findMany({
        where: {
          status: "ACTIVE",
          OR: [{ projectManagerId: actorId }, { timesheetApproverUserId: actorId }],
        },
        select: { id: true, projectNumber: true, title: true, kind: true, startDate: true, endDate: true },
      });
      for (const project of managed) {
        pushProject(project);
      }
    }
    res.json({ data: options });
  } catch (error) {
    console.error("Error fetching active projects for timesheets:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/project-cases", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    const roles = await effectiveRolesForUser(actorId, role);
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
    const weekStart =
      typeof req.query.weekStart === "string" && req.query.weekStart.trim()
        ? req.query.weekStart.trim()
        : null;
    const asMemberUserId =
      typeof req.query.asMemberUserId === "string" && req.query.asMemberUserId.trim()
        ? req.query.asMemberUserId.trim()
        : actorId;
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    const project = await prisma.project.findFirst({
      where: { id: projectId, status: "ACTIVE" },
      select: {
        kind: true,
        projectNumber: true,
        title: true,
        projectManagerId: true,
        timesheetApproverUserId: true,
      },
    });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const hasMembership = await userHasActiveProjectMembership(asMemberUserId, projectId);
    if (asMemberUserId !== actorId) {
      if (!canActAsTimesheetApprover(actorId, roles, project)) {
        return res.status(403).json({ error: "Forbidden" });
      }
    } else if (!hasMembership && !roles.includes("admin")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const projectOption = {
      kind: "project" as const,
      id: projectId,
      label: `${project.projectNumber} — ${project.title}`,
    };
    const tickets = await listTimesheetTicketsForProject(projectId, weekStart);
    const ticketOptions = tickets.map((row) => ({
      kind: "ticket" as const,
      id: row.id,
      status: row.status,
      label: `${row.ticketNumber} — ${row.subject} (${formatTicketStatusLabel(row.status)})`,
    }));

    if (project.kind === "SUPPORT") {
      return res.json({
        data: [projectOption, ...ticketOptions],
      });
    }

    const opportunityWhere: Prisma.OpportunityWhereInput = {
      active: true,
      status: { in: ["IN_PROGRESS", "ACCEPTED", "PROPOSAL"] },
    };
    if (!(roles.includes("admin") && !hasMembership)) {
      opportunityWhere.ownerId = asMemberUserId;
    }
    const opportunities = await prisma.opportunity.findMany({
      where: opportunityWhere,
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    res.json({
      data: [
        projectOption,
        ...ticketOptions,
        ...opportunities.map((row) => ({
          kind: "opportunity" as const,
          id: row.id,
          label: row.name,
        })),
      ],
    });
  } catch (error) {
    console.error("Error fetching project cases:", error);
    res.status(500).json({ error: "Failed to fetch cases" });
  }
});

router.get("/active-targets", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);

    const whereMember = await projectMemberWhereForUser(actorId);
    const projectMemberships = await prisma.projectMember.findMany({
      where: { ...whereMember, project: { status: "ACTIVE" } },
      include: {
        project: { select: { id: true, title: true, projectNumber: true } },
      },
      orderBy: { project: { updatedAt: "desc" } },
    });

    const projects = projectMemberships.map((row) => ({
      kind: "project" as const,
      id: row.project.id,
      label: `${row.project.projectNumber} — ${row.project.title}`,
    }));

    const opportunityWhere: Prisma.OpportunityWhereInput = {
      active: true,
      status: { in: ["IN_PROGRESS", "ACCEPTED", "PROPOSAL"] },
      ownerId: actorId,
    };

    const opportunities = await prisma.opportunity.findMany({
      where: opportunityWhere,
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const cases = opportunities.map((row) => ({
      kind: "opportunity" as const,
      id: row.id,
      label: row.name,
    }));

    const groupMemberships = await prisma.projectSupportGroupMember.findMany({
      where: { adminUserId: actorId, group: { project: { status: "ACTIVE", kind: "SUPPORT" } } },
      select: { group: { select: { projectId: true } } },
    });
    const supportProjectIds = groupMemberships.map((m) => m.group.projectId);
    const supportTickets =
      supportProjectIds.length > 0
        ? await prisma.ticket.findMany({
            where: {
              projectId: { in: supportProjectIds },
              status: { in: ["OPEN", "IN_PROGRESS", "PENDING_CLIENT"] },
            },
            select: { id: true, ticketNumber: true, subject: true },
            orderBy: { updatedAt: "desc" },
            take: 100,
          })
        : [];
    const ticketTargets = supportTickets.map((row) => ({
      kind: "ticket" as const,
      id: row.id,
      label: `${row.ticketNumber} — ${row.subject}`,
    }));

    res.json({ data: [...projects, ...cases, ...ticketTargets] });
  } catch (error) {
    console.error("Error fetching active targets for timesheets:", error);
    res.status(500).json({ error: "Failed to fetch targets" });
  }
});

router.get("/target-meta", async (req: AuthRequest, res) => {
  try {
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
    const opportunityId = typeof req.query.opportunityId === "string" ? req.query.opportunityId : "";
    const ticketId = typeof req.query.ticketId === "string" ? req.query.ticketId : "";

    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          project: { include: { projectManager: { select: { name: true, email: true } } } },
        },
      });
      if (!ticket) return res.status(404).json({ error: "Support case not found" });
      const approvers = await buildProjectApprovers(ticket.projectId);
      const projectDates = ticket.project
        ? projectDateBoundsIso(ticket.project)
        : null;
      return res.json({
        data: {
          kind: "ticket",
          managerName: ticket.project?.projectManager?.name || ticket.project?.projectManager?.email || "",
          approvers,
          startDate: projectDates?.startDate ?? null,
          endDate: projectDates?.endDate ?? null,
        },
      });
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { projectManager: { select: { name: true, email: true } } },
      });
      if (!project) return res.status(404).json({ error: "Project not found" });
      const approvers = await buildProjectApprovers(projectId);
      const { startDate, endDate } = projectDateBoundsIso(project);
      return res.json({
        data: {
          kind: "project",
          managerName: project.projectManager?.name || project.projectManager?.email || "",
          approvers,
          startDate,
          endDate,
        },
      });
    }

    if (opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: { owner: { select: { name: true, email: true } } },
      });
      if (!opportunity) return res.status(404).json({ error: "Case not found" });
      return res.json({
        data: {
          kind: "opportunity",
          managerName: opportunity.owner?.name || opportunity.owner?.email || "",
        },
      });
    }

    return res.status(400).json({ error: "projectId, opportunityId, or ticketId is required" });
  } catch (error) {
    console.error("Error fetching timesheet target meta:", error);
    res.status(500).json({ error: "Failed to fetch target details" });
  }
});

async function buildProjectApprovers(projectId: string | null | undefined) {
  if (!projectId) return [];
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectManager: { select: { name: true, email: true } },
      clientContacts: {
        where: { canApproveTimesheets: true },
        include: { contact: { select: { name: true, email: true } } },
      },
    },
  });
  if (!project) return [];
  const pmName = project.projectManager?.name || project.projectManager?.email || "Project manager";
  const clientRows = project.clientContacts.map((row) => {
    const who = row.contact.name?.trim() || row.contact.email?.trim() || "Client contact";
    return {
      kind: "CLIENT_CONTACT" as const,
      id: row.id,
      label: `${who} (client)`,
    };
  });
  const pmRow = { kind: "PM" as const, id: "PM", label: pmName };
  if (project.kind === "SUPPORT" && clientRows.length > 0) {
    return [...clientRows, pmRow];
  }
  return [pmRow, ...clientRows];
}

router.get("/defaults", async (_req, res) => {
  res.json({
    data: {
      startDate: mondayOfWeek().toISOString(),
      endDate: sundayOfWeek().toISOString(),
    },
  });
});

router.get("/create-entry", async (req: AuthRequest, res) => {
  try {
    await resolveTimesheetEntryPoint(req, res);
  } catch (error) {
    console.error("Error resolving timesheet entry point:", error);
    res.status(500).json({ error: "Failed to resolve timesheet entry" });
  }
});

router.get("/entry-point", async (req: AuthRequest, res) => {
  try {
    await resolveTimesheetEntryPoint(req, res);
  } catch (error) {
    console.error("Error resolving timesheet entry point:", error);
    res.status(500).json({ error: "Failed to resolve timesheet entry" });
  }
});

router.get("/recent-submitted", async (req: AuthRequest, res) => {
  try {
    const limitRaw = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 3;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 10) : 3;
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    const roles = await effectiveRolesForUser(actorId, role);
    const where = submittedTimesheetsPendingPmApprovalWhere(actorId, roles);
    const rows = await prisma.timesheet.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        memberUser: { select: { name: true, email: true } },
        project: { select: { projectNumber: true, title: true } },
      },
    });
    res.json({
      data: rows.map((row) => ({
        id: row.id,
        status: row.status,
        memberName: row.memberUser?.name || row.memberUser?.email || "",
        projectLabel: row.project
          ? `${row.project.projectNumber} — ${row.project.title}`
          : "",
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching recent submitted timesheets:", error);
    res.status(500).json({ error: "Failed to fetch timesheets" });
  }
});

router.get("/for-week", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    const roles = await effectiveRolesForUser(actorId, role);
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
    const startDateRaw = typeof req.query.startDate === "string" ? req.query.startDate : "";
    const memberUserIdRaw =
      typeof req.query.memberUserId === "string" && req.query.memberUserId.trim()
        ? req.query.memberUserId.trim()
        : actorId;
    if (!projectId || !startDateRaw) {
      return res.status(400).json({ error: "projectId and startDate are required" });
    }
    if (memberUserIdRaw !== actorId) {
      const projectForAccess = await prisma.project.findUnique({
        where: { id: projectId },
        select: { projectManagerId: true, timesheetApproverUserId: true },
      });
      if (!projectForAccess || !canActAsTimesheetApprover(actorId, roles, projectForAccess)) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    const startDate = new Date(`${startDateRaw}T00:00:00.000Z`);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid startDate" });
    }
    const row = await prisma.timesheet.findFirst({
      where: { memberUserId: memberUserIdRaw, projectId, startDate },
      include: detailInclude,
    });
    if (!row) return res.json({ data: null });
    const accessWhere = await timesheetAccessWhere(req);
    const allowed = await prisma.timesheet.findFirst({ where: { id: row.id, ...accessWhere } });
    if (!allowed) return res.json({ data: null });
    res.json({ data: mapDetail(row) });
  } catch (error) {
    console.error("Error fetching timesheet for week:", error);
    res.status(500).json({ error: "Failed to fetch timesheet" });
  }
});

function csvEscape(value: string | number | null | undefined) {
  const s = value == null ? "" : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function assertTimesheetProjectDateRules(
  projectId: string,
  startDate: Date,
  resolved: ReturnType<typeof resolveTimesheetTargets>,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { startDate: true, endDate: true, status: true },
  });
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const weekMondayIso = startDate.toISOString().slice(0, 10);
  assertTimesheetWithinProjectDates(
    project,
    weekMondayIso,
    resolved.entryRows,
    resolved.dailyHours ?? null,
  );
}

router.get("/export", async (req: AuthRequest, res) => {
  try {
    const accessWhere = await timesheetAccessWhere(req);
    const timesheetId =
      typeof req.query.timesheetId === "string" && req.query.timesheetId.trim()
        ? req.query.timesheetId.trim()
        : "";
    const idsRaw = typeof req.query.ids === "string" ? req.query.ids : "";
    const exportIds = idsRaw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const where =
      exportIds.length > 0
        ? { ...accessWhere, id: { in: exportIds } }
        : timesheetId
          ? { ...accessWhere, id: timesheetId }
          : accessWhere;
    const rows = await prisma.timesheet.findMany({
      where,
      include: {
        project: {
          select: {
            projectNumber: true,
            title: true,
            projectManager: { select: { name: true, email: true } },
            timesheetApprover: { select: { name: true, email: true } },
          },
        },
        memberUser: { select: { name: true, email: true } },
        projectClientContact: { include: { contact: { select: { name: true, email: true } } } },
        entries: {
          orderBy: { sortOrder: "asc" },
          include: {
            opportunity: { select: { name: true } },
            ticket: { select: { ticketNumber: true, subject: true } },
          },
        },
      },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    });

    if (timesheetId && rows.length === 0) {
      return res.status(404).json({ error: "Timesheet not found" });
    }

    const hydrated = await Promise.all(rows.map((row) => hydrateTimesheetApproverRow(row)));
    const exportRows = hydrated.map((row) => ({
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      comments: row.comments,
      dailyHours: row.dailyHours,
      dailyComments: row.dailyComments,
      memberUser: row.memberUser,
      project: row.project,
      entries: row.entries,
      approverLabel: resolveTimesheetApproverLabel(row),
    }));

    const filename = timesheetId ? `timesheet-${timesheetId}.csv` : "timesheets.csv";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buildTimesheetTemplateCsv(exportRows));
  } catch (error) {
    console.error("Error exporting timesheets:", error);
    res.status(500).json({ error: "Failed to export timesheets" });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const where = await timesheetAccessWhere(req);
    const rows = await prisma.timesheet.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            projectNumber: true,
            clientId: true,
            client: { select: { id: true, name: true } },
            projectManagerId: true,
            timesheetApproverUserId: true,
            projectManager: { select: { name: true, email: true } },
            timesheetApprover: { select: { name: true, email: true } },
          },
        },
        opportunity: { select: { id: true, name: true } },
        memberUser: { select: { id: true, name: true, email: true } },
        projectClientContact: { include: { contact: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    const hydrated = await Promise.all(rows.map((row) => hydrateTimesheetApproverRow(row)));
    res.json({ data: hydrated.map((row) => serializeTimesheet({ ...row, activityLogs: [] })) });
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    res.status(500).json({ error: "Failed to fetch timesheets" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const timesheetId = req.params.id;
    if (!timesheetId) return res.status(400).json({ error: "Invalid id" });
    if (!isLikelyTimesheetId(timesheetId)) {
      return res.status(404).json({ error: "Timesheet not found" });
    }
    const row = await fetchTimesheet(timesheetId);
    if (!row) return res.status(404).json({ error: "Not found" });
    const where = await timesheetAccessWhere(req);
    const allowed = await prisma.timesheet.findFirst({ where: { id: timesheetId, ...where } });
    if (!allowed) return res.status(403).json({ error: "Forbidden" });
    const role = req.user?.role ?? "";
    const actorId = getActorId(req);
    const hydrated = await hydrateTimesheetApproverRow(row);
    res.json({
      data: await mapDetailWithActions(hydrated, actorId, role),
    });
  } catch (error) {
    console.error("Error fetching timesheet:", error);
    res.status(500).json({ error: "Failed to fetch timesheet" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role ?? "";
    const actorId = getActorId(req);
    const roles = await effectiveRolesForUser(actorId, role);
    if (!(await actorMayLogTimesheets(actorId, role))) {
      return res.status(403).json({ error: "Only project members can create timesheets" });
    }
    const data = timesheetSchema.parse(req.body);
    await assertMemberCanSubmitTimesheets(actorId, roles, { impersonatorId: req.user?.impersonatorId });

    let resolved;
    try {
      resolved = resolveTimesheetTargets(data);
    } catch (error) {
      if (error instanceof Error && error.message === "PROJECT_REQUIRED") {
        return res.status(400).json({ error: "Select a project for line entries" });
      }
      throw error;
    }

    if (resolved.projectId) {
      const ok = await userHasActiveProjectMembership(actorId, resolved.projectId);
      if (!ok) {
        return res.status(400).json({ error: "You are not assigned to this active project" });
      }
      const approverOptions = await buildProjectApprovers(resolved.projectId);
      if (approverOptions.length > 0) {
        if (!data.approverKind) {
          return res.status(400).json({ error: "Choose an approver for your timesheet" });
        }
        if (data.approverKind === "CLIENT_CONTACT" && !data.projectClientContactId) {
          return res.status(400).json({ error: "Choose an approver for your timesheet" });
        }
      }
      await assertTimesheetProjectDateRules(resolved.projectId, data.startDate, resolved);
      const duplicate = await prisma.timesheet.findFirst({
        where: {
          memberUserId: actorId,
          projectId: resolved.projectId,
          startDate: data.startDate,
        },
        select: { id: true },
      });
      if (duplicate) {
        return res.status(409).json({
          error: "A timesheet already exists for this project and week",
          data: { id: duplicate.id },
        });
      }
      if (resolved.entryRows.length > 0) {
        await assertValidTimesheetEntries(actorId, resolved.projectId, resolved.entryRows);
      }
    } else if (data.opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({ where: { id: data.opportunityId } });
      if (!opportunity || !opportunity.active) {
        return res.status(400).json({ error: "Invalid case" });
      }
      if (opportunity.ownerId !== actorId) {
        return res.status(400).json({ error: "You can only log time on cases you own" });
      }
    } else if (data.ticketId) {
      const ticket = await prisma.ticket.findUnique({ where: { id: data.ticketId } });
      if (!ticket?.projectId) return res.status(400).json({ error: "Invalid support case" });
      const inGroup = await prisma.projectSupportGroupMember.findFirst({
        where: { adminUserId: actorId, group: { projectId: ticket.projectId } },
      });
      if (!inGroup) {
        return res.status(400).json({ error: "You are not on the support team for this case" });
      }
    }

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.timesheet.create({
        data: {
          projectId: resolved.projectId,
          opportunityId: resolved.opportunityId,
          ticketId: resolved.ticketId,
          approverKind: data.approverKind ?? null,
          projectClientContactId:
            data.approverKind === "CLIENT_CONTACT" ? data.projectClientContactId ?? null : null,
          memberUserId: actorId,
          startDate: data.startDate,
          endDate: data.endDate,
          status: "DRAFT",
          fileUrls: data.fileUrls ?? [],
          dailyHours: resolved.dailyHours ?? undefined,
          dailyComments: resolved.dailyComments ?? undefined,
          comments: data.comments?.trim() || null,
        },
      });
      if (resolved.entryRows.length > 0) {
        await replaceTimesheetEntries(tx, created.id, resolved.entryRows);
      }
      await tx.timesheetActivityLog.create({
        data: {
          timesheetId: created.id,
          action: "CREATED",
          performedById: actorId,
        },
      });
      return created;
    });

    const detail = await fetchTimesheet(row.id);
    const warnings = await memberTimesheetProfileWarnings(actorId, roles, req.user?.impersonatorId);
    res.status(201).json({ data: detail ? mapDetail(detail) : null, warnings });
  } catch (error) {
    if (error instanceof Error && error.message === "AGREEMENT_REQUIRED") {
      return res.status(403).json({ error: "Sign your agreement before creating timesheets" });
    }
    if (error instanceof Error && error.message === "INVALID_ENTRY_TICKET") {
      return res.status(400).json({ error: "One or more tickets do not belong to this project" });
    }
    if (error instanceof Error && error.message === "INVALID_ENTRY_OPPORTUNITY") {
      return res.status(400).json({ error: "One or more cases are invalid or not owned by you" });
    }
    if (error instanceof Error && error.message === "TIMESHEET_WEEK_OUTSIDE_PROJECT") {
      return res.status(400).json({
        error: "This week falls outside the project start and end dates",
      });
    }
    if (error instanceof Error && error.message === "TIMESHEET_HOURS_OUTSIDE_PROJECT") {
      return res.status(400).json({
        error: "Hours can only be logged on days within the project start and end dates",
      });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    console.error("Error creating timesheet:", error);
    res.status(500).json({ error: "Failed to create timesheet" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const data = timesheetSchema.parse(req.body);
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    const roles = await effectiveRolesForUser(actorId, role);
    if (!(await actorMayLogTimesheets(actorId, role))) {
      return res.status(403).json({ error: "Only project members can edit timesheets" });
    }
    await assertMemberCanSubmitTimesheets(actorId, roles, { impersonatorId: req.user?.impersonatorId });
    const existing = await prisma.timesheet.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.memberUserId !== actorId) return res.status(403).json({ error: "Forbidden" });
    if (existing.status !== "DRAFT") {
      return res.status(400).json({ error: "Only draft timesheets can be edited" });
    }

    let resolved;
    try {
      resolved = resolveTimesheetTargets(data);
    } catch (error) {
      if (error instanceof Error && error.message === "PROJECT_REQUIRED") {
        return res.status(400).json({ error: "Select a project for line entries" });
      }
      throw error;
    }

    if (resolved.projectId) {
      const ok = await userHasActiveProjectMembership(actorId, resolved.projectId);
      if (!ok) {
        return res.status(400).json({ error: "You are not assigned to this active project" });
      }
      await assertTimesheetProjectDateRules(resolved.projectId, data.startDate, resolved);
      const duplicate = await prisma.timesheet.findFirst({
        where: {
          memberUserId: actorId,
          projectId: resolved.projectId,
          startDate: data.startDate,
          id: { not: req.params.id },
        },
        select: { id: true },
      });
      if (duplicate) {
        return res.status(409).json({
          error: "A timesheet already exists for this project and week",
          data: { id: duplicate.id },
        });
      }
      if (resolved.entryRows.length > 0) {
        await assertValidTimesheetEntries(actorId, resolved.projectId, resolved.entryRows);
      }
    }

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id: req.params.id },
        data: {
          projectId: resolved.projectId,
          opportunityId: resolved.opportunityId,
          ticketId: resolved.ticketId,
          approverKind: data.approverKind ?? null,
          projectClientContactId:
            data.approverKind === "CLIENT_CONTACT" ? data.projectClientContactId ?? null : null,
          startDate: data.startDate,
          endDate: data.endDate,
          fileUrls: data.fileUrls ?? [],
          dailyHours: resolved.dailyHours ?? undefined,
          dailyComments: resolved.dailyComments ?? undefined,
          comments: data.comments?.trim() || null,
        },
      });
      if (resolved.entryRows.length > 0) {
        await replaceTimesheetEntries(tx, updated.id, resolved.entryRows);
      } else if (data.entries) {
        await tx.timesheetEntry.deleteMany({ where: { timesheetId: updated.id } });
      }
      await tx.timesheetActivityLog.create({
        data: { timesheetId: updated.id, action: "UPDATED", performedById: actorId },
      });
      return updated;
    });

    const detail = await fetchTimesheet(row.id);
    const warnings = await memberTimesheetProfileWarnings(actorId, roles, req.user?.impersonatorId);
    res.json({ data: detail ? await mapDetailWithActions(detail, actorId, role) : null, warnings });
  } catch (error) {
    if (error instanceof Error && error.message === "AGREEMENT_REQUIRED") {
      return res.status(403).json({ error: "Sign your agreement before editing timesheets" });
    }
    if (error instanceof Error && error.message === "INVALID_ENTRY_TICKET") {
      return res.status(400).json({ error: "One or more tickets do not belong to this project" });
    }
    if (error instanceof Error && error.message === "INVALID_ENTRY_OPPORTUNITY") {
      return res.status(400).json({ error: "One or more cases are invalid or not owned by you" });
    }
    if (error instanceof Error && error.message === "TIMESHEET_WEEK_OUTSIDE_PROJECT") {
      return res.status(400).json({
        error: "This week falls outside the project start and end dates",
      });
    }
    if (error instanceof Error && error.message === "TIMESHEET_HOURS_OUTSIDE_PROJECT") {
      return res.status(400).json({
        error: "Hours can only be logged on days within the project start and end dates",
      });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    console.error("Error updating timesheet:", error);
    res.status(500).json({ error: "Failed to update timesheet" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    const roles = await effectiveRolesForUser(actorId, role);
    const canManageAll = roles.includes("admin");
    const existing = await prisma.timesheet.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    if (canManageAll) {
      await prisma.timesheet.delete({ where: { id: existing.id } });
      return res.json({ data: { id: existing.id } });
    }

    if (existing.memberUserId !== actorId) {
      return res.status(403).json({ error: "You can only delete your own timesheets" });
    }
    if (existing.status !== "DRAFT") {
      return res.status(403).json({
        error:
          existing.status === "SUBMITTED"
            ? "Submitted timesheets cannot be deleted while awaiting approval"
            : "This timesheet cannot be deleted",
      });
    }
    if (!(await actorMayLogTimesheets(actorId, role))) {
      return res.status(403).json({ error: "Only project members can delete timesheets" });
    }

    await prisma.timesheet.delete({ where: { id: existing.id } });
    res.json({ data: { id: existing.id } });
  } catch (error) {
    console.error("Error deleting timesheet:", error);
    res.status(500).json({ error: "Failed to delete timesheet" });
  }
});

const submitSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        approverKind: z.enum(["PM", "CLIENT_CONTACT"]).optional(),
        projectClientContactId: z.string().min(1).optional(),
      }),
    )
    .min(1),
});

type SubmitTimesheetItem = {
  id: string;
  approverKind?: "PM" | "CLIENT_CONTACT";
  projectClientContactId?: string;
};

router.post("/submit", async (req: AuthRequest, res) => {
  try {
    const raw = req.body as { items?: unknown; ids?: string[] };
    const items: SubmitTimesheetItem[] | null =
      Array.isArray(raw.items) && raw.items.length
        ? submitSchema.parse({ items: raw.items }).items
        : Array.isArray(raw.ids) && raw.ids.length
          ? raw.ids.map((id) => ({ id }))
          : null;
    if (!items) return res.status(400).json({ error: "No timesheets to submit" });
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    const roles = await effectiveRolesForUser(actorId, role);
    if (!(await actorMayLogTimesheets(actorId, role))) {
      return res.status(403).json({ error: "Only project members can submit timesheets" });
    }
    await assertMemberCanSubmitTimesheets(actorId, roles, { impersonatorId: req.user?.impersonatorId });
    const ids = items.map((i) => i.id);
    const rows = await prisma.timesheet.findMany({
      where: { id: { in: ids }, memberUserId: actorId, status: "DRAFT" },
      include: {
        project: { select: { kind: true } },
        ticket: { select: { projectId: true } },
      },
    });
    if (!rows.length) return res.status(400).json({ error: "No draft timesheets found" });

    const itemMap = new Map(items.map((i) => [i.id, i]));

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        const item = itemMap.get(row.id);
        const approverProjectId = row.projectId ?? row.ticket?.projectId ?? null;
        let approverKind: string | null = row.approverKind;
        let projectClientContactId: string | null = row.projectClientContactId;
        const chosenKind = item?.approverKind ?? row.approverKind ?? "PM";
        if (chosenKind === "CLIENT_CONTACT" && approverProjectId) {
          const contactId = item?.projectClientContactId ?? row.projectClientContactId;
          if (!contactId) {
            throw new Error("APPROVER_REQUIRED");
          }
          const link = await tx.projectClientContact.findFirst({
            where: {
              id: contactId,
              projectId: approverProjectId,
              canApproveTimesheets: true,
            },
          });
          if (!link) throw new Error("INVALID_APPROVER");
          approverKind = "CLIENT_CONTACT";
          projectClientContactId = link.id;
        } else {
          approverKind = "PM";
          projectClientContactId = null;
        }
        await tx.timesheet.update({
          where: { id: row.id },
          data: { status: "SUBMITTED", approverKind, projectClientContactId },
        });
        await tx.timesheetActivityLog.create({
          data: { timesheetId: row.id, action: "SUBMITTED", performedById: actorId },
        });
      }
    });

    const submitted = await prisma.timesheet.findMany({
      where: {
        id: { in: rows.map((r) => r.id) },
        status: "SUBMITTED",
      },
      select: { id: true, approverKind: true },
    });
    for (const row of submitted) {
      if (row.approverKind === "CLIENT_CONTACT") {
        notifyAsync("timesheet.submitted.client", { timesheetId: row.id });
      } else {
        notifyAsync("timesheet.submitted.approver", { timesheetId: row.id });
      }
    }

    const warnings = await memberTimesheetProfileWarnings(actorId, roles, req.user?.impersonatorId);
    res.json({ data: { submitted: rows.length }, warnings });
  } catch (error) {
    if (error instanceof Error && error.message === "APPROVER_REQUIRED") {
      return res.status(400).json({ error: "Select an approver for this support timesheet" });
    }
    if (error instanceof Error && error.message === "INVALID_APPROVER") {
      return res.status(400).json({ error: "Invalid timesheet approver" });
    }
    if (error instanceof Error && error.message === "AGREEMENT_REQUIRED") {
      return res.status(403).json({ error: "Sign your agreement before submitting timesheets" });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    console.error("Error submitting timesheets:", error);
    res.status(500).json({ error: "Failed to submit timesheets" });
  }
});

router.post("/:id/approve", async (req: AuthRequest, res) => {
  try {
    const timesheetId = req.params.id;
    if (!timesheetId) return res.status(400).json({ error: "Invalid id" });
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    const existing = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: {
        project: { select: { projectManagerId: true, timesheetApproverUserId: true } },
        opportunity: { select: { ownerId: true } },
      },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const roles = await effectiveRolesForUser(actorId, role);
    const canApproveProject =
      existing.project && canActAsTimesheetApprover(actorId, roles, existing.project);
    const ownsOpportunity = existing.opportunity?.ownerId === actorId;
    const canApproveAsClient = await clientContactCanActOnTimesheet(actorId, existing);
    if (!canApproveProject && !ownsOpportunity && !canApproveAsClient) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (existing.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Only submitted timesheets can be approved" });
    }
    if (existing.approverKind === "CLIENT_CONTACT" && !canApproveAsClient) {
      return res.status(403).json({ error: "This timesheet must be approved by the selected client contact" });
    }
    if (existing.approverKind !== "CLIENT_CONTACT" && !canApproveProject && !ownsOpportunity) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.timesheet.update({ where: { id: timesheetId }, data: { status: "APPROVED", rejectReason: null } });
      await tx.timesheetActivityLog.create({
        data: { timesheetId, action: "APPROVED", performedById: actorId },
      });
    });

    notifyAsync("timesheet.approved", { timesheetId });

    const detail = await fetchTimesheet(timesheetId);
    res.json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    console.error("Error approving timesheet:", error);
    res.status(500).json({ error: "Failed to approve timesheet" });
  }
});

const rejectSchema = z.object({
  reason: z.string().min(1).max(5000),
});

router.post("/:id/reject", async (req: AuthRequest, res) => {
  try {
    const timesheetId = req.params.id;
    if (!timesheetId) return res.status(400).json({ error: "Invalid id" });
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    const { reason } = rejectSchema.parse(req.body);

    const existing = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: {
        project: { select: { projectManagerId: true, timesheetApproverUserId: true } },
        opportunity: { select: { ownerId: true } },
      },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const roles = await effectiveRolesForUser(actorId, role);
    const canRejectProject =
      existing.project && canActAsTimesheetApprover(actorId, roles, existing.project);
    const ownsOpportunity = existing.opportunity?.ownerId === actorId;
    const canRejectAsClient = await clientContactCanActOnTimesheet(actorId, existing);
    if (!canRejectProject && !ownsOpportunity && !canRejectAsClient) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (existing.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Only submitted timesheets can be rejected" });
    }
    if (existing.approverKind === "CLIENT_CONTACT" && !canRejectAsClient) {
      return res.status(403).json({ error: "This timesheet must be rejected by the selected client contact" });
    }
    if (existing.approverKind !== "CLIENT_CONTACT" && !canRejectProject && !ownsOpportunity) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const trimmed = reason.trim();
    const commentBlock = `[Rejected ${new Date().toISOString().slice(0, 10)}] ${trimmed}`;
    const mergedComments = existing.comments
      ? `${commentBlock}\n\n${existing.comments}`
      : commentBlock;

    await prisma.$transaction(async (tx) => {
      await tx.timesheet.update({
        where: { id: timesheetId },
        data: { status: "DRAFT", rejectReason: trimmed, comments: mergedComments },
      });
      await tx.timesheetActivityLog.create({
        data: {
          timesheetId,
          action: "REJECTED",
          reason: reason.trim(),
          performedById: actorId,
        },
      });
    });

    notifyAsync("timesheet.rejected", { timesheetId, reason: trimmed });

    const detail = await fetchTimesheet(timesheetId);
    res.json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    console.error("Error rejecting timesheet:", error);
    res.status(500).json({ error: "Failed to reject timesheet" });
  }
});

export { router as timesheetRoutes, fetchTimesheet, mapDetail };
