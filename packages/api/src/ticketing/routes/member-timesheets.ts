import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import { authMiddleware, type TicketingRequest } from "../middleware/auth.js";
import { formatZodError } from "../../lib/zod-error.js";

const router: IRouter = Router();

router.use(authMiddleware);

async function resolveMemberAdminUserId(req: TicketingRequest): Promise<string | null> {
  const portalUser = await prisma.ticketingUser.findUnique({
    where: { id: req.ticketingUser!.id },
    select: { tbosAdminUserId: true, active: true },
  });
  if (!portalUser?.active || !portalUser.tbosAdminUserId) return null;
  const admin = await prisma.adminUser.findUnique({
    where: { id: portalUser.tbosAdminUserId },
    select: { id: true, active: true },
  });
  if (!admin?.active) return null;
  return admin.id;
}

router.get("/targets", async (req: TicketingRequest, res) => {
  const memberUserId = await resolveMemberAdminUserId(req);
  if (!memberUserId) return res.json({ data: [] });

  const projectMemberships = await prisma.projectMember.findMany({
    where: { adminUserId: memberUserId, project: { status: "ACTIVE" } },
    include: { project: { select: { id: true, title: true, projectNumber: true } } },
    orderBy: { project: { updatedAt: "desc" } },
  });

  const projects = projectMemberships.map((row) => ({
    kind: "project" as const,
    id: row.project.id,
    label: `${row.project.projectNumber} — ${row.project.title}`,
  }));

  const groupMemberships = await prisma.projectSupportGroupMember.findMany({
    where: { adminUserId: memberUserId, group: { project: { status: "ACTIVE", kind: "SUPPORT" } } },
    select: { group: { select: { projectId: true } } },
  });
  const supportProjectIds = groupMemberships.map((m) => m.group.projectId);

  const tickets =
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

  const cases = tickets.map((row) => ({
    kind: "ticket" as const,
    id: row.id,
    label: `${row.ticketNumber} — ${row.subject}`,
  }));

  res.json({ data: [...projects, ...cases] });
});

router.get("/target-meta", async (req: TicketingRequest, res) => {
  const memberUserId = await resolveMemberAdminUserId(req);
  if (!memberUserId) return res.status(403).json({ error: "Forbidden" });

  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : "";
  const ticketId = typeof req.query.ticketId === "string" ? req.query.ticketId : "";

  if (ticketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { createdBy: { select: { name: true, email: true } } },
    });
    if (!ticket) return res.status(404).json({ error: "Not found" });
    const creator = ticket.createdBy?.name || ticket.createdBy?.email || "";
    return res.json({ data: { managerName: creator, approverLabel: creator } });
  }

  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { projectManager: { select: { name: true, email: true } } },
    });
    if (!project) return res.status(404).json({ error: "Not found" });
    const managerName = project.projectManager?.name || project.projectManager?.email || "";
    return res.json({ data: { managerName, approverLabel: managerName } });
  }

  return res.status(400).json({ error: "projectId or ticketId required" });
});

router.get("/", async (req: TicketingRequest, res) => {
  const memberUserId = await resolveMemberAdminUserId(req);
  if (!memberUserId) return res.json({ data: [] });

  const rows = await prisma.timesheet.findMany({
    where: { memberUserId },
    include: {
      project: { select: { projectNumber: true, title: true } },
      ticket: { select: { ticketNumber: true, subject: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  res.json({
    data: rows.map((row) => ({
      id: row.id,
      status: row.status,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      targetLabel: row.ticket
        ? `${row.ticket.ticketNumber} — ${row.ticket.subject}`
        : row.project
          ? `${row.project.projectNumber} — ${row.project.title}`
          : "—",
    })),
  });
});

const createSchema = z.object({
  projectId: z.string().optional(),
  ticketId: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

router.post("/", async (req: TicketingRequest, res) => {
  const memberUserId = await resolveMemberAdminUserId(req);
  if (!memberUserId) return res.status(403).json({ error: "Forbidden" });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error), details: parsed.error.errors });
  }
  const input = parsed.data;
  if (!input.projectId && !input.ticketId) {
    return res.status(400).json({ error: "Select a project or case" });
  }
  if (input.endDate < input.startDate) {
    return res.status(400).json({ error: "End date must be on or after start date" });
  }

  const row = await prisma.timesheet.create({
    data: {
      memberUserId,
      projectId: input.projectId ?? null,
      ticketId: input.ticketId ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "DRAFT",
      approverKind: input.ticketId ? "CLIENT_CONTACT" : "PM",
    },
  });

  res.status(201).json({ data: { id: row.id } });
});

export { router as memberTimesheetRoutes };
