import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

/** Global header search: leads, clients, opportunities. */
router.get("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant?.tenantId;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q || q.length < 2) {
    return res.json({ data: { leads: [], clients: [], opportunities: [] } });
  }
  if (!tenantId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [leads, clients, opportunities] = await Promise.all([
    prisma.lead.findMany({
      where: {
        tenantId,
        OR: [
          { firstName: contains },
          { lastName: contains },
          { email: contains },
          { company: contains },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
        status: true,
      },
    }),
    prisma.client.findMany({
      where: {
        tenantId,
        OR: [{ name: contains }, { website: contains }],
      },
      orderBy: { name: "asc" },
      take: 8,
      select: { id: true, name: true, website: true, country: true, status: true },
    }),
    prisma.opportunity.findMany({
      where: {
        tenantId,
        OR: [
          { name: contains },
          { client: { name: contains } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        amount: true,
        currency: true,
        active: true,
        client: { select: { id: true, name: true } },
        stage: { select: { name: true } },
      },
    }),
  ]);

  return res.json({
    data: {
      leads: leads.map((l) => ({
        id: l.id,
        name: `${l.firstName} ${l.lastName}`.trim(),
        company: l.company,
        email: l.email,
        status: l.status,
      })),
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        website: c.website,
        country: c.country,
        status: c.status,
      })),
      opportunities: opportunities.map((o) => ({
        id: o.id,
        name: o.name,
        clientName: o.client.name,
        stage: o.stage?.name ?? null,
        amount: Number(o.amount),
        currency: o.currency,
        active: o.active,
      })),
    },
  });
});

export { router as crmSearchRoutes };
