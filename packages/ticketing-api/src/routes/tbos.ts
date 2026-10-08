import { Router, type IRouter } from "express";
import { z } from "zod";
import { TicketStatus, ticketingPrisma } from "@techbubble/ticketing-database";
import { tbosAuthMiddleware, requireTbosAdmin, type TbosRequest } from "../middleware/tbos-auth.js";
import { assignedOrganizationIds } from "../lib/ticket-access.js";

const router: IRouter = Router();

router.use(tbosAuthMiddleware);

function isTbosAdminRole(role: string) {
  return role.trim().toLowerCase() === "admin";
}

async function orgFilterForTbos(tbosUser: { id: string; role: string }) {
  if (isTbosAdminRole(tbosUser.role)) return {};
  const consultant = await ticketingPrisma.ticketingUser.findFirst({
    where: { tbosAdminUserId: tbosUser.id, role: "CONSULTANT", consultantVerified: true },
  });
  if (!consultant) return { organizationId: { in: [] as string[] } };
  const orgIds = await assignedOrganizationIds(consultant.id);
  return { organizationId: { in: orgIds } };
}

router.get("/tickets", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const organizationId = typeof req.query.organizationId === "string" ? req.query.organizationId : "";

  const orgScope = await orgFilterForTbos(tbosUser);
  const where: {
    organizationId?: string | { in: string[] };
    status?: TicketStatus;
  } = { ...orgScope };

  if (organizationId) {
    if (orgScope.organizationId && typeof orgScope.organizationId === "object") {
      if (!orgScope.organizationId.in.includes(organizationId)) {
        return res.json({ data: [] });
      }
    }
    where.organizationId = organizationId;
  }

  if (status && Object.values(TicketStatus).includes(status as TicketStatus)) {
    where.status = status as TicketStatus;
  }

  const rows = await ticketingPrisma.ticket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({
    data: rows.map((row) => ({
      id: row.id,
      ticketNumber: row.ticketNumber,
      organizationId: row.organizationId,
      organization: row.organization,
      type: row.type,
      priority: row.priority,
      status: row.status,
      subject: row.subject,
      description: row.description,
      createdById: row.createdById,
      createdBy: row.createdBy,
      assignedToId: row.assignedToId,
      assignedTo: row.assignedTo,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      closedAt: row.closedAt?.toISOString() ?? null,
    })),
  });
});

router.get("/tickets/:id", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const orgScope = await orgFilterForTbos(tbosUser);
  const ticket = await ticketingPrisma.ticket.findFirst({
    where: { id: req.params.id, ...orgScope },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 50, include: { actor: { select: { id: true, name: true } } } },
    },
  });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const messages = await ticketingPrisma.ticketMessage.findMany({
    where: { ticketId: ticket.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true, role: true } } },
  });

  res.json({
    data: {
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      closedAt: ticket.closedAt?.toISOString() ?? null,
      messages,
    },
  });
});

router.get("/organizations", async (req: TbosRequest, res) => {
  const tbosUser = req.tbosUser!;
  const orgScope = await orgFilterForTbos(tbosUser);
  const where =
    orgScope.organizationId && typeof orgScope.organizationId === "object"
      ? { id: { in: orgScope.organizationId.in }, active: true }
      : { active: true };

  const rows = await ticketingPrisma.organization.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  res.json({ data: rows });
});

router.put("/consultants/:consultantId/organizations", requireTbosAdmin, async (req: TbosRequest, res) => {
  const parsed = z.object({ organizationIds: z.array(z.string()) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "organizationIds array required" });

  const consultant = await ticketingPrisma.ticketingUser.findFirst({
    where: { id: req.params.consultantId, role: "CONSULTANT" },
  });
  if (!consultant) return res.status(404).json({ error: "Consultant not found" });

  await ticketingPrisma.consultantOrganization.deleteMany({ where: { consultantId: consultant.id } });
  if (parsed.data.organizationIds.length > 0) {
    await ticketingPrisma.consultantOrganization.createMany({
      data: parsed.data.organizationIds.map((organizationId) => ({
        consultantId: consultant.id,
        organizationId,
      })),
      skipDuplicates: true,
    });
  }

  const assigned = await ticketingPrisma.consultantOrganization.findMany({
    where: { consultantId: consultant.id },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });
  res.json({ data: assigned.map((a) => a.organization) });
});

router.get("/consultants", requireTbosAdmin, async (_req, res) => {
  const rows = await ticketingPrisma.ticketingUser.findMany({
    where: { role: "CONSULTANT", consultantVerified: true },
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      tbosRole: true,
      consultantOrganizations: {
        include: { organization: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  res.json({
    data: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      tbosRole: r.tbosRole,
      organizations: r.consultantOrganizations.map((c) => c.organization),
    })),
  });
});

export { router as tbosRoutes };
