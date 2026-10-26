import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import { authMiddleware, type TicketingRequest } from "../middleware/auth.js";
import {
  ensureClientApproverContactLinks,
  resolveClientTimesheetProjectIds,
} from "../lib/client-timesheet-projects.js";
import { formatZodError } from "../../lib/zod-error.js";
import { notifyAsync } from "../../lib/notifications";
import { submittedTimesheetsPendingPmApprovalWhere } from "../../lib/timesheet-approver.js";
import { fetchTimesheet, mapDetail } from "../../routes/timesheets.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.get("/summary", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;

  if (user.role === "CONSULTANT" && user.tbosAdminUserId) {
    const managerId = user.tbosAdminUserId;
    const projectScope = {
      OR: [
        { project: { projectManagerId: managerId } },
        { project: { timesheetApproverUserId: managerId } },
      ],
    };
    const [total, pendingApproval] = await Promise.all([
      prisma.timesheet.count({ where: projectScope }),
      prisma.timesheet.count({
        where: {
          status: "SUBMITTED",
          OR: [{ approverKind: "PM" }, { approverKind: null }],
          AND: [projectScope],
        },
      }),
    ]);
    return res.json({ data: { total, pendingApproval } });
  }

  if (user.role !== "CLIENT") {
    return res.json({ data: { total: 0, pendingApproval: 0 } });
  }

  const projectIds = await resolveClientTimesheetProjectIds(user.id, user.organizationId ?? null);
  if (!projectIds.length) {
    return res.json({ data: { total: 0, pendingApproval: 0 } });
  }

  const submittedWhere = {
    projectId: { in: projectIds },
    status: { in: ["SUBMITTED", "APPROVED"] },
  };
  const [total, pendingApproval] = await Promise.all([
    prisma.timesheet.count({ where: submittedWhere }),
    prisma.timesheet.count({
      where: {
        projectId: { in: projectIds },
        status: "SUBMITTED",
        approverKind: "CLIENT_CONTACT",
      },
    }),
  ]);

  res.json({ data: { total, pendingApproval } });
});

router.get("/recent-submitted", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  const limitRaw = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 3;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 10) : 3;

  let where: {
    status: "SUBMITTED";
    projectId?: { in: string[] };
    project?: { projectManagerId: string };
    OR?: Array<{ approverKind: string | null } | { approverKind: string }>;
    approverKind?: string;
    projectClientContactId?: { in: string[] };
  } = { status: "SUBMITTED" };

  if (user.role === "CONSULTANT" && user.tbosAdminUserId) {
    const managerId = user.tbosAdminUserId;
    where = submittedTimesheetsPendingPmApprovalWhere(managerId, ["project_manager"]) as typeof where;
  } else if (user.role === "CLIENT") {
    const links = await ensureClientApproverContactLinks(user.id, user.email);
    const linkIds = links.map((l) => l.id);
    if (!linkIds.length) return res.json({ data: [] });
    where = {
      status: "SUBMITTED",
      approverKind: "CLIENT_CONTACT",
      projectClientContactId: { in: linkIds },
    };
  } else {
    return res.json({ data: [] });
  }

  const rows = await prisma.timesheet.findMany({
    where,
    include: {
      memberUser: { select: { name: true, email: true } },
      project: { select: { projectNumber: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
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
});

router.get("/", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (user.role !== "CLIENT") {
    return res.json({ data: [] });
  }

  const status = typeof req.query.status === "string" ? req.query.status : "";
  const projectIds = await resolveClientTimesheetProjectIds(user.id, user.organizationId);
  if (!projectIds.length) return res.json({ data: [] });

  const where: { projectId: { in: string[] }; status?: string } = { projectId: { in: projectIds } };
  if (status) where.status = status;

  const rows = await prisma.timesheet.findMany({
    where,
    include: {
      memberUser: { select: { name: true, email: true } },
      project: { select: { projectNumber: true, title: true } },
      ticket: { select: { ticketNumber: true, subject: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  res.json({
    data: rows.map((row) => ({
      id: row.id,
      status: row.status,
      memberName: row.memberUser?.name || row.memberUser?.email || "",
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      approverKind: row.approverKind,
      targetLabel: row.ticket
        ? `${row.ticket.ticketNumber} — ${row.ticket.subject}`
        : row.project
          ? `${row.project.projectNumber} — ${row.project.title}`
          : "",
    })),
  });
});

router.get("/pending-approval", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (user.role !== "CLIENT") {
    return res.json({ data: [] });
  }

  const links = await ensureClientApproverContactLinks(user.id, user.email);
  const linkIds = links.map((l) => l.id);
  if (!linkIds.length) return res.json({ data: [] });

  const rows = await prisma.timesheet.findMany({
    where: {
      status: "SUBMITTED",
      approverKind: "CLIENT_CONTACT",
      projectClientContactId: { in: linkIds },
    },
    include: {
      memberUser: { select: { name: true, email: true } },
      project: { select: { projectNumber: true, title: true } },
      ticket: { select: { ticketNumber: true, subject: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json({
    data: rows.map((row) => ({
      id: row.id,
      memberName: row.memberUser?.name || row.memberUser?.email || "",
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      targetLabel: row.ticket
        ? `${row.ticket.ticketNumber} — ${row.ticket.subject}`
        : row.project
          ? `${row.project.projectNumber} — ${row.project.title}`
          : "",
    })),
  });
});

const decisionSchema = z.object({
  reason: z.string().max(5000).optional(),
});

router.get("/:id", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (user.role !== "CLIENT") return res.status(403).json({ error: "Forbidden" });

  const links = await ensureClientApproverContactLinks(user.id, user.email);
  const linkIds = links.map((row) => row.id);
  if (!linkIds.length) return res.status(403).json({ error: "Forbidden" });

  const timesheetId = req.params.id;
  if (!timesheetId) return res.status(400).json({ error: "Invalid id" });

  const timesheet = await fetchTimesheet(timesheetId);
  if (!timesheet) return res.status(404).json({ error: "Not found" });

  if (
    timesheet.approverKind !== "CLIENT_CONTACT" ||
    !timesheet.projectClientContactId ||
    !linkIds.includes(timesheet.projectClientContactId)
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!["SUBMITTED", "APPROVED", "REJECTED"].includes(timesheet.status)) {
    return res.status(404).json({ error: "Not found" });
  }

  const canApprove = timesheet.status === "SUBMITTED";
  res.json({ data: { ...mapDetail(timesheet), canApprove } });
});

router.post("/:id/approve", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (user.role !== "CLIENT") return res.status(403).json({ error: "Forbidden" });

  const timesheet = await prisma.timesheet.findUnique({ where: { id: req.params.id } });
  if (!timesheet || timesheet.status !== "SUBMITTED" || timesheet.approverKind !== "CLIENT_CONTACT") {
    return res.status(404).json({ error: "Timesheet not found" });
  }

  const link = await prisma.projectClientContact.findFirst({
    where: {
      id: timesheet.projectClientContactId ?? "",
      ticketingUserId: user.id,
      canApproveTimesheets: true,
    },
  });
  if (!link) return res.status(403).json({ error: "Forbidden" });

  await prisma.$transaction(async (tx) => {
    await tx.timesheet.update({
      where: { id: timesheet.id },
      data: { status: "APPROVED", rejectReason: null },
    });
    await tx.timesheetActivityLog.create({
      data: {
        timesheetId: timesheet.id,
        action: "APPROVED",
        reason: `Approved by client contact ${user.email}`,
      },
    });
  });

  notifyAsync("timesheet.approved", { timesheetId: timesheet.id });

  res.json({ data: { id: timesheet.id, status: "APPROVED" } });
});

router.post("/:id/reject", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (user.role !== "CLIENT") return res.status(403).json({ error: "Forbidden" });
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error), details: parsed.error.errors });
  }

  const timesheet = await prisma.timesheet.findUnique({ where: { id: req.params.id } });
  if (!timesheet || timesheet.status !== "SUBMITTED" || timesheet.approverKind !== "CLIENT_CONTACT") {
    return res.status(404).json({ error: "Timesheet not found" });
  }

  const link = await prisma.projectClientContact.findFirst({
    where: {
      id: timesheet.projectClientContactId ?? "",
      ticketingUserId: user.id,
      canApproveTimesheets: true,
    },
  });
  if (!link) return res.status(403).json({ error: "Forbidden" });

  const reason = parsed.data.reason?.trim() || "Rejected by client contact";
  const commentBlock = `[Rejected ${new Date().toISOString().slice(0, 10)}] ${reason}`;
  const mergedComments = timesheet.comments
    ? `${commentBlock}\n\n${timesheet.comments}`
    : commentBlock;

  await prisma.$transaction(async (tx) => {
    await tx.timesheet.update({
      where: { id: timesheet.id },
      data: { status: "DRAFT", rejectReason: reason, comments: mergedComments },
    });
    await tx.timesheetActivityLog.create({
      data: {
        timesheetId: timesheet.id,
        action: "REJECTED",
        reason,
      },
    });
  });

  notifyAsync("timesheet.rejected", { timesheetId: timesheet.id, reason });

  res.json({ data: { id: timesheet.id, status: "DRAFT" } });
});

export { router as ticketingTimesheetRoutes };
