import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const userId = req.user!.id;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [overdueNextSteps, dueSoon, newLeads, closingThisMonth, contractsAttention] =
    await Promise.all([
      prisma.opportunity.findMany({
        where: {
          tenantId,
          active: true,
          nextStepDue: { lt: now },
          OR: [{ ownerId: userId }, { ownerId: null }],
        },
        include: { client: { select: { id: true, name: true } }, stage: true },
        orderBy: { nextStepDue: "asc" },
        take: 20,
      }),
      prisma.opportunity.findMany({
        where: {
          tenantId,
          active: true,
          nextStepDue: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) },
        },
        include: { client: { select: { id: true, name: true } }, stage: true },
        orderBy: { nextStepDue: "asc" },
        take: 20,
      }),
      prisma.lead.findMany({
        where: {
          tenantId,
          status: "NEW",
          createdAt: { gte: new Date(now.getTime() - 14 * 86400000) },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.opportunity.findMany({
        where: {
          tenantId,
          active: true,
          OR: [
            { nextStepDue: { gte: monthStart, lte: monthEnd } },
            { stage: { stageType: "open", winProbability: { gte: 75 } } },
          ],
        },
        include: { client: { select: { id: true, name: true } }, stage: true },
        take: 20,
      }),
      prisma.contract.findMany({
        where: {
          tenantId,
          status: "ACTIVE",
        },
        include: { client: { select: { id: true, name: true } } },
        take: 100,
      }),
    ]);

  const burnAttention = contractsAttention
    .map((c) => {
      const value = Number(c.contractValue) + Number(c.totalVariation);
      const consumed = Number(c.consumed);
      const pct = value > 0 ? consumed / value : 0;
      return { contract: c, pct };
    })
    .filter((x) => x.pct >= 0.8)
    .slice(0, 10);

  return res.json({
    data: {
      overdueNextSteps: overdueNextSteps.map((o) => ({
        id: o.id,
        name: o.name,
        nextStep: o.nextStep,
        nextStepDue: o.nextStepDue,
        client: o.client,
        stage: o.stage?.name,
      })),
      dueSoon: dueSoon.map((o) => ({
        id: o.id,
        name: o.name,
        nextStep: o.nextStep,
        nextStepDue: o.nextStepDue,
        client: o.client,
        stage: o.stage?.name,
      })),
      newLeads: newLeads.map((l) => ({
        id: l.id,
        name: `${l.firstName} ${l.lastName}`,
        company: l.company,
        email: l.email,
        createdAt: l.createdAt,
      })),
      closingThisMonth: closingThisMonth.map((o) => ({
        id: o.id,
        name: o.name,
        amount: Number(o.amount),
        currency: o.currency,
        client: o.client,
        stage: o.stage?.name,
        probability: o.probability,
      })),
      contractBurn: burnAttention.map(({ contract: c, pct }) => ({
        id: c.id,
        title: c.title,
        contractNumber: c.contractNumber,
        client: c.client,
        burnPct: pct,
        consumed: Number(c.consumed),
        contractValue: Number(c.contractValue) + Number(c.totalVariation),
      })),
    },
  });
});

export { router as crmMyDayRoutes };
