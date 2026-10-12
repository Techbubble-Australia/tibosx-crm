import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import { authMiddleware, type TicketingRequest } from "../middleware/auth.js";
import { resolveClientTimesheetProjectIds } from "../lib/client-timesheet-projects.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.get("/summary", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;

  if (user.role === "CONSULTANT" && user.tbosAdminUserId) {
    const managerId = user.tbosAdminUserId;
    const [total, pendingApproval] = await Promise.all([
      prisma.timesheet.count({
        where: {
          project: { projectManagerId: managerId },
        },
      }),
      prisma.timesheet.count({
        where: {
          status: "SUBMITTED",
          OR: [{ approverKind: "PM" }, { approverKind: null }],
          project: { projectManagerId: managerId },
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

  const [total, pendingApproval] = await Promise.all([
    prisma.timesheet.count({ where: { projectId: { in: projectIds } } }),
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
    })),
  });
});

router.get("/pending-approval", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (user.role !== "CLIENT") {
    return res.json({ data: [] });
  }

  const links = await prisma.projectClientContact.findMany({
    where: { ticketingUserId: user.id, canApproveTimesheets: true },
    select: { id: true },
  });
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

  res.json({ data: { id: timesheet.id, status: "APPROVED" } });
});

router.post("/:id/reject", async (req: TicketingRequest, res) => {
  const user = req.ticketingUser!;
  if (user.role !== "CLIENT") return res.status(403).json({ error: "Forbidden" });
  const parsed = decisionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation error" });

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

  await prisma.$transaction(async (tx) => {
    await tx.timesheet.update({
      where: { id: timesheet.id },
      data: { status: "DRAFT", rejectReason: reason },
    });
    await tx.timesheetActivityLog.create({
      data: {
        timesheetId: timesheet.id,
        action: "REJECTED",
        reason,
      },
    });
  });

  res.json({ data: { id: timesheet.id, status: "DRAFT" } });
});

export { router as ticketingTimesheetRoutes };
