import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, type Prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import {
  canManageAllTimesheets,
  getActorId,
  isProjectManagerRole,
  isProjectMemberRole,
} from "../lib/project-access";
import { getMemberOnboardingStatus } from "../lib/member-onboarding";
import { mondayOfWeek, sundayOfWeek, TIMESHEET_STATUSES, TIMESHEET_STATUS_LABELS } from "../lib/project-types";

const router: IRouter = Router();

const timesheetSchema = z
  .object({
    projectId: z.string().min(1).optional(),
    opportunityId: z.string().min(1).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    fileUrls: z.array(z.string().min(1)).min(1, "At least one file is required"),
  })
  .refine((data) => Boolean(data.projectId || data.opportunityId), {
    message: "Select a project or case",
  })
  .refine((data) => !(data.projectId && data.opportunityId), {
    message: "Select either a project or a case, not both",
  });

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
  memberUserId: string;
  startDate: Date;
  endDate: Date;
  status: string;
  fileUrls: unknown;
  rejectReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: { id: string; title: string; projectNumber: string; projectManagerId: string } | null;
  opportunity?: { id: string; name: string } | null;
  memberUser?: { id: string; name: string | null; email: string };
  activityLogs?: ReturnType<typeof serializeActivity>[];
}) {
  const fileUrls = Array.isArray(row.fileUrls)
    ? row.fileUrls.filter((url): url is string => typeof url === "string")
    : [];
  const status = row.status as keyof typeof TIMESHEET_STATUS_LABELS;
  return {
    id: row.id,
    projectId: row.projectId,
    opportunityId: row.opportunityId,
    projectTitle: row.project?.title ?? "",
    projectNumber: row.project?.projectNumber ?? "",
    opportunityName: row.opportunity?.name ?? "",
    targetLabel: row.project
      ? `${row.project.projectNumber} — ${row.project.title}`
      : row.opportunity?.name ?? "",
    memberUserId: row.memberUserId,
    memberName: row.memberUser?.name || row.memberUser?.email || "",
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    status: row.status,
    statusLabel: TIMESHEET_STATUS_LABELS[status] ?? row.status,
    fileUrls,
    rejectReason: row.rejectReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    activityLogs: row.activityLogs ?? [],
  };
}

const detailInclude = {
  project: { select: { id: true, title: true, projectNumber: true, projectManagerId: true } },
  opportunity: { select: { id: true, name: true, ownerId: true } },
  memberUser: { select: { id: true, name: true, email: true } },
  activityLogs: {
    orderBy: { createdAt: "desc" as const },
    include: { performedBy: { select: { name: true, email: true } } },
  },
};

async function fetchTimesheet(id: string) {
  return prisma.timesheet.findUnique({ where: { id }, include: detailInclude });
}

function mapDetail(row: NonNullable<Awaited<ReturnType<typeof fetchTimesheet>>>) {
  return serializeTimesheet({
    ...row,
    activityLogs: row.activityLogs.map(serializeActivity),
  });
}

async function timesheetAccessWhere(req: AuthRequest): Promise<Prisma.TimesheetWhereInput> {
  const role = req.user?.role ?? "";
  const actorId = getActorId(req);
  if (canManageAllTimesheets(role) && role === "admin") {
    return {};
  }
  if (isProjectManagerRole(role)) {
    return {
      OR: [
        { project: { projectManagerId: actorId } },
        { opportunity: { ownerId: actorId } },
      ],
    };
  }
  return { memberUserId: actorId };
}

async function assertMemberCanSubmitTimesheets(actorId: string, role: string) {
  if (!isProjectMemberRole(role)) return;
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
    const memberships = await prisma.projectMember.findMany({
      where: { adminUserId: actorId, project: { status: "ACTIVE" } },
      include: {
        project: {
          select: { id: true, title: true, projectNumber: true, status: true, updatedAt: true },
        },
      },
      orderBy: { project: { updatedAt: "desc" } },
    });
    res.json({
      data: memberships.map((row) => row.project),
    });
  } catch (error) {
    console.error("Error fetching active projects for timesheets:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/active-targets", async (req: AuthRequest, res) => {
  try {
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";

    const projectMemberships = await prisma.projectMember.findMany({
      where: { adminUserId: actorId, project: { status: "ACTIVE" } },
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
    };
    if (isProjectMemberRole(role)) {
      opportunityWhere.ownerId = actorId;
    } else if (isProjectManagerRole(role) && role !== "admin") {
      opportunityWhere.ownerId = actorId;
    }

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

    res.json({ data: [...projects, ...cases] });
  } catch (error) {
    console.error("Error fetching active targets for timesheets:", error);
    res.status(500).json({ error: "Failed to fetch targets" });
  }
});

router.get("/target-meta", async (req: AuthRequest, res) => {
  try {
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
    const opportunityId = typeof req.query.opportunityId === "string" ? req.query.opportunityId : "";

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { projectManager: { select: { name: true, email: true } } },
      });
      if (!project) return res.status(404).json({ error: "Project not found" });
      return res.json({
        data: {
          kind: "project",
          managerName: project.projectManager?.name || project.projectManager?.email || "",
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

    return res.status(400).json({ error: "projectId or opportunityId is required" });
  } catch (error) {
    console.error("Error fetching timesheet target meta:", error);
    res.status(500).json({ error: "Failed to fetch target details" });
  }
});

router.get("/defaults", async (_req, res) => {
  res.json({
    data: {
      startDate: mondayOfWeek().toISOString(),
      endDate: sundayOfWeek().toISOString(),
    },
  });
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const where = await timesheetAccessWhere(req);
    const rows = await prisma.timesheet.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, projectNumber: true, projectManagerId: true } },
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
    res.json({ data: mapDetail(row) });
  } catch (error) {
    console.error("Error fetching timesheet:", error);
    res.status(500).json({ error: "Failed to fetch timesheet" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role ?? "";
    if (!isProjectMemberRole(role) && !isProjectManagerRole(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const data = timesheetSchema.parse(req.body);
    const actorId = getActorId(req);
    await assertMemberCanSubmitTimesheets(actorId, role);

    if (data.projectId) {
      const membership = await prisma.projectMember.findFirst({
        where: { adminUserId: actorId, projectId: data.projectId, project: { status: "ACTIVE" } },
      });
      if (!membership && !isProjectManagerRole(role)) {
        return res.status(400).json({ error: "You are not assigned to this active project" });
      }
    } else if (data.opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({ where: { id: data.opportunityId } });
      if (!opportunity || !opportunity.active) {
        return res.status(400).json({ error: "Invalid case" });
      }
      if (isProjectMemberRole(role) && opportunity.ownerId !== actorId) {
        return res.status(400).json({ error: "You can only log time on cases you own" });
      }
      if (isProjectManagerRole(role) && role === "project_manager" && opportunity.ownerId !== actorId) {
        return res.status(400).json({ error: "You can only log time on cases you own" });
      }
    }

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.timesheet.create({
        data: {
          projectId: data.projectId ?? null,
          opportunityId: data.opportunityId ?? null,
          memberUserId: actorId,
          startDate: data.startDate,
          endDate: data.endDate,
          status: "DRAFT",
          fileUrls: data.fileUrls,
        },
      });
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
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
    await assertMemberCanSubmitTimesheets(actorId, role);
    const existing = await prisma.timesheet.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.memberUserId !== actorId) return res.status(403).json({ error: "Forbidden" });
    if (existing.status !== "DRAFT") {
      return res.status(400).json({ error: "Only draft timesheets can be edited" });
    }

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.timesheet.update({
        where: { id: req.params.id },
        data: {
          projectId: data.projectId ?? null,
          opportunityId: data.opportunityId ?? null,
          startDate: data.startDate,
          endDate: data.endDate,
          fileUrls: data.fileUrls,
        },
      });
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating timesheet:", error);
    res.status(500).json({ error: "Failed to update timesheet" });
  }
});

const submitSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

router.post("/submit", async (req: AuthRequest, res) => {
  try {
    const { ids } = submitSchema.parse(req.body);
    const actorId = getActorId(req);
    const role = req.user?.role ?? "";
    await assertMemberCanSubmitTimesheets(actorId, role);
    const rows = await prisma.timesheet.findMany({
      where: { id: { in: ids }, memberUserId: actorId, status: "DRAFT" },
    });
    if (!rows.length) return res.status(400).json({ error: "No draft timesheets found" });

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.timesheet.update({ where: { id: row.id }, data: { status: "SUBMITTED" } });
        await tx.timesheetActivityLog.create({
          data: { timesheetId: row.id, action: "SUBMITTED", performedById: actorId },
        });
      }
    });

    res.json({ data: { submitted: rows.length } });
  } catch (error) {
    if (error instanceof Error && error.message === "AGREEMENT_REQUIRED") {
      return res.status(403).json({ error: "Sign your agreement before submitting timesheets" });
    }
    if (error instanceof Error && error.message === "PROFILE_REQUIRED") {
      return res.status(403).json({ error: "Complete your profile before submitting timesheets" });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
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
    if (!isProjectManagerRole(role)) return res.status(403).json({ error: "Forbidden" });

    const existing = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: {
        project: { select: { projectManagerId: true } },
        opportunity: { select: { ownerId: true } },
      },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (role === "project_manager") {
      const managesProject = existing.project?.projectManagerId === actorId;
      const ownsOpportunity = existing.opportunity?.ownerId === actorId;
      if (!managesProject && !ownsOpportunity) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    if (existing.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Only submitted timesheets can be approved" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.timesheet.update({ where: { id: timesheetId }, data: { status: "APPROVED", rejectReason: null } });
      await tx.timesheetActivityLog.create({
        data: { timesheetId, action: "APPROVED", performedById: actorId },
      });
    });

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
    if (!isProjectManagerRole(role)) return res.status(403).json({ error: "Forbidden" });
    const { reason } = rejectSchema.parse(req.body);

    const existing = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: {
        project: { select: { projectManagerId: true } },
        opportunity: { select: { ownerId: true } },
      },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (role === "project_manager") {
      const managesProject = existing.project?.projectManagerId === actorId;
      const ownsOpportunity = existing.opportunity?.ownerId === actorId;
      if (!managesProject && !ownsOpportunity) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    if (existing.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Only submitted timesheets can be rejected" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.timesheet.update({
        where: { id: timesheetId },
        data: { status: "DRAFT", rejectReason: reason.trim() },
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

    const detail = await fetchTimesheet(timesheetId);
    res.json({ data: detail ? mapDetail(detail) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error rejecting timesheet:", error);
    res.status(500).json({ error: "Failed to reject timesheet" });
  }
});

export { router as timesheetRoutes };
