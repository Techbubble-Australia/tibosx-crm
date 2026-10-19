import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, type Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import {
  canManageAllTimesheets,
  getActorId,
  isProjectManagerRole,
} from "../lib/project-access";
import { canActAsTimesheetApprover } from "../lib/timesheet-approver";
import { effectiveRolesForUser, hasEffectiveRole } from "../lib/admin-roles";
import { getMemberOnboardingStatus } from "../lib/member-onboarding";
import { notifyAsync } from "../lib/notifications";
import { mondayOfWeek, sundayOfWeek, TIMESHEET_STATUSES, TIMESHEET_STATUS_LABELS } from "../lib/project-types";
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
} from "../lib/timesheet-entries";

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
}) {
  return {
    id: row.id,
    sortOrder: row.sortOrder,
    opportunityId: row.opportunityId,
    ticketId: row.ticketId,
    label: entryLabel(row),
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
  project?: { id: string; title: string; projectNumber: string; projectManagerId: string } | null;
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
    approverLabel:
      row.approverKind === "CLIENT_CONTACT"
        ? row.projectClientContact?.contact.name || row.projectClientContact?.contact.email || "Client contact"
        : row.approverKind === "PM"
          ? "Project manager"
          : "",
    projectTitle: row.project?.title ?? "",
    projectNumber: row.project?.projectNumber ?? "",
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
    entries: row.entries.map(serializeEntry),
  });
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
  }
  return { OR: or };
}

async function assertMemberCanSubmitTimesheets(actorId: string, roles: string[]) {
  if (!hasEffectiveRole(roles, "project_member")) return;
  const onboarding = await getMemberOnboardingStatus(actorId);
  if (!onboarding.agreementSigned) {
    throw new Error("AGREEMENT_REQUIRED");
  }
  if (!onboarding.profileComplete) {
    throw new Error("PROFILE_REQUIRED");
  }
}

router.get("/active-projects", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);
    const projectMemberships = await listActiveProjectMembershipsForUser(actorId);
    res.json({
      data: projectMemberships.map((row) => ({
        id: row.project.id,
        label: `${row.project.projectNumber} — ${row.project.title}`,
        kind: row.project.kind,
      })),
    });
  } catch (error) {
    console.error("Error fetching active projects for timesheets:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/project-cases", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    const hasMembership = await userHasActiveProjectMembership(actorId, projectId);
    if (!hasMembership) return res.status(403).json({ error: "Forbidden" });
    const whereMember = await projectMemberWhereForUser(actorId);
    const membership = await prisma.projectMember.findFirst({
      where: { ...whereMember, projectId, project: { status: "ACTIVE" } },
      include: {
        project: { select: { kind: true, projectNumber: true, title: true } },
      },
    });
    if (!membership?.project) return res.status(403).json({ error: "Forbidden" });

    if (membership.project.kind === "SUPPORT") {
      const supportOrg = await prisma.organization.findFirst({
        where: { projectId, active: true },
        select: { id: true },
      });
      const tickets = await prisma.ticket.findMany({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS", "PENDING_CLIENT"] },
          OR: [
            { projectId },
            ...(supportOrg ? [{ organizationId: supportOrg.id }] : []),
          ],
        },
        select: { id: true, ticketNumber: true, subject: true },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });
      const projectOption = {
        kind: "project" as const,
        id: projectId,
        label: `${membership.project.projectNumber} — ${membership.project.title}`,
      };
      return res.json({
        data: [
          projectOption,
          ...tickets.map((row) => ({
            kind: "ticket" as const,
            id: row.id,
            label: `${row.ticketNumber} — ${row.subject}`,
          })),
        ],
      });
    }

    const opportunities = await prisma.opportunity.findMany({
      where: {
        active: true,
        status: { in: ["IN_PROGRESS", "ACCEPTED", "PROPOSAL"] },
        ownerId: actorId,
      },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    res.json({
      data: opportunities.map((row) => ({
        kind: "opportunity" as const,
        id: row.id,
        label: row.name,
      })),
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
      return res.json({
        data: {
          kind: "ticket",
          managerName: ticket.project?.projectManager?.name || ticket.project?.projectManager?.email || "",
          approvers,
        },
      });
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { projectManager: { select: { name: true, email: true } } },
      });
      if (!project) return res.status(404).json({ error: "Project not found" });
      const approvers = project.kind === "SUPPORT" ? await buildProjectApprovers(projectId) : [];
      return res.json({
        data: {
          kind: "project",
          managerName: project.projectManager?.name || project.projectManager?.email || "",
          approvers,
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
  const clientRows = project.clientContacts.map((row) => ({
    kind: "CLIENT_CONTACT" as const,
    id: row.id,
    label: `${row.contact.name} (client)`,
  }));
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

router.get("/for-week", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
    const startDateRaw = typeof req.query.startDate === "string" ? req.query.startDate : "";
    if (!projectId || !startDateRaw) {
      return res.status(400).json({ error: "projectId and startDate are required" });
    }
    const startDate = new Date(`${startDateRaw}T00:00:00.000Z`);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "Invalid startDate" });
    }
    const row = await prisma.timesheet.findFirst({
      where: { memberUserId: actorId, projectId, startDate },
      include: detailInclude,
    });
    if (!row) return res.json({ data: null });
    res.json({ data: mapDetail(row) });
  } catch (error) {
    console.error("Error fetching timesheet for week:", error);
    res.status(500).json({ error: "Failed to fetch timesheet" });
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
      projectManagerId: true,
      timesheetApproverUserId: true,
    },
  },
        opportunity: { select: { id: true, name: true } },
        memberUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: rows.map((row) => serializeTimesheet({ ...row, activityLogs: [] })) });
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    res.status(500).json({ error: "Failed to fetch timesheets" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const timesheetId = req.params.id;
    if (!timesheetId) return res.status(400).json({ error: "Invalid id" });
    const row = await fetchTimesheet(timesheetId);
    if (!row) return res.status(404).json({ error: "Not found" });
    const where = await timesheetAccessWhere(req);
    const allowed = await prisma.timesheet.findFirst({ where: { id: timesheetId, ...where } });
    if (!allowed) return res.status(403).json({ error: "Forbidden" });
    const role = req.user?.role ?? "";
    const actorId = getActorId(req);
    const canApprove =
      row.status === "SUBMITTED" &&
      row.approverKind !== "CLIENT_CONTACT" &&
      ((row.project && canActAsTimesheetApprover(actorId, role, row.project)) ||
        row.opportunity?.ownerId === actorId);
    const canSubmit = row.memberUserId === actorId && row.status === "DRAFT";
    res.json({
      data: {
        ...mapDetail(row),
        canApprove,
        canSubmit,
      },
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
    if (!hasEffectiveRole(roles, "project_member")) {
      return res.status(403).json({ error: "Only project members can create timesheets" });
    }
    const data = timesheetSchema.parse(req.body);
    await assertMemberCanSubmitTimesheets(actorId, roles);

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
      if (resolved.entryRows.length > 0) {
        await assertValidTimesheetEntries(actorId, resolved.projectId, resolved.entryRows);
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
    res.status(201).json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    if (error instanceof Error && error.message === "AGREEMENT_REQUIRED") {
      return res.status(403).json({ error: "Sign your agreement before creating timesheets" });
    }
    if (error instanceof Error && error.message === "PROFILE_REQUIRED") {
      return res.status(403).json({ error: "Complete your profile before creating timesheets" });
    }
    if (error instanceof Error && error.message === "INVALID_ENTRY_TICKET") {
      return res.status(400).json({ error: "One or more tickets do not belong to this project" });
    }
    if (error instanceof Error && error.message === "INVALID_ENTRY_OPPORTUNITY") {
      return res.status(400).json({ error: "One or more cases are invalid or not owned by you" });
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
    if (!hasEffectiveRole(roles, "project_member")) {
      return res.status(403).json({ error: "Only project members can edit timesheets" });
    }
    await assertMemberCanSubmitTimesheets(actorId, roles);
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
    res.json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    if (error instanceof Error && error.message === "AGREEMENT_REQUIRED") {
      return res.status(403).json({ error: "Sign your agreement before editing timesheets" });
    }
    if (error instanceof Error && error.message === "PROFILE_REQUIRED") {
      return res.status(403).json({ error: "Complete your profile before editing timesheets" });
    }
    if (error instanceof Error && error.message === "INVALID_ENTRY_TICKET") {
      return res.status(400).json({ error: "One or more tickets do not belong to this project" });
    }
    if (error instanceof Error && error.message === "INVALID_ENTRY_OPPORTUNITY") {
      return res.status(400).json({ error: "One or more cases are invalid or not owned by you" });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    console.error("Error updating timesheet:", error);
    res.status(500).json({ error: "Failed to update timesheet" });
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
    if (!hasEffectiveRole(roles, "project_member")) {
      return res.status(403).json({ error: "Only project members can submit timesheets" });
    }
    await assertMemberCanSubmitTimesheets(actorId, roles);
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
        let supportProjectId: string | null = null;
        if (row.project?.kind === "SUPPORT" && row.projectId) {
          supportProjectId = row.projectId;
        } else if (row.ticket?.projectId) {
          const project = await tx.project.findUnique({
            where: { id: row.ticket.projectId },
            select: { kind: true },
          });
          if (project?.kind === "SUPPORT") supportProjectId = row.ticket.projectId;
        }
        let approverKind: string | null = row.approverKind;
        let projectClientContactId: string | null = row.projectClientContactId;
        if (!supportProjectId) {
          approverKind = null;
          projectClientContactId = null;
        } else {
          const chosenKind = item?.approverKind ?? row.approverKind ?? "PM";
          if (chosenKind === "CLIENT_CONTACT") {
            const contactId = item?.projectClientContactId ?? row.projectClientContactId;
            if (!contactId) {
              throw new Error("APPROVER_REQUIRED");
            }
            const link = await tx.projectClientContact.findFirst({
              where: {
                id: contactId,
                projectId: supportProjectId,
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

    res.json({ data: { submitted: rows.length } });
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
    if (error instanceof Error && error.message === "PROFILE_REQUIRED") {
      return res.status(403).json({ error: "Complete your profile before submitting timesheets" });
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
    const canApproveProject =
      existing.project && canActAsTimesheetApprover(actorId, role, existing.project);
    const ownsOpportunity = existing.opportunity?.ownerId === actorId;
    if (!canApproveProject && !ownsOpportunity) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (existing.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Only submitted timesheets can be approved" });
    }
    if (existing.approverKind === "CLIENT_CONTACT") {
      return res.status(400).json({ error: "This timesheet must be approved by the selected client contact in the support portal" });
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
    const canRejectProject =
      existing.project && canActAsTimesheetApprover(actorId, role, existing.project);
    const ownsOpportunity = existing.opportunity?.ownerId === actorId;
    if (!canRejectProject && !ownsOpportunity) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (existing.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Only submitted timesheets can be rejected" });
    }
    if (existing.approverKind === "CLIENT_CONTACT") {
      return res.status(400).json({ error: "This timesheet must be rejected by the selected client contact in the support portal" });
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

export { router as timesheetRoutes };
