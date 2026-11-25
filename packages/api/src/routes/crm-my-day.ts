import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { resolveContractExpiryDate } from "../lib/sales-forecast";

const router: IRouter = Router();

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Infer Call / Task badge from free-text next step (wireframe labels). */
function activityKind(nextStep: string | null | undefined): "Call" | "Task" {
  const text = (nextStep ?? "").trim().toLowerCase();
  if (!text) return "Task";
  if (/\b(call|phone|ring|dial)\b/.test(text)) return "Call";
  if (/\b(meeting|meet|demo|zoom|teams)\b/.test(text)) return "Call";
  return "Task";
}

function leadSourceLabel(source: string | null | undefined): string {
  const s = (source ?? "manual").trim().toLowerCase();
  if (s === "website" || s === "web" || s === "contact_form" || s === "website_form") {
    return "website form";
  }
  if (s === "manual") return "manual entry";
  return s.replace(/_/g, " ");
}

router.get("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const userId = req.user!.id;
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const [
    dueTodayRows,
    overdueRows,
    dueSoonRows,
    newLeads,
    closingThisMonth,
    contractsActive,
    overdueDraftTimesheets,
  ] = await Promise.all([
    prisma.opportunity.findMany({
      where: {
        tenantId,
        active: true,
        nextStepDue: { gte: todayStart, lte: todayEnd },
        OR: [{ ownerId: userId }, { ownerId: null }],
      },
      include: { client: { select: { id: true, name: true } }, stage: true },
      orderBy: { nextStepDue: "asc" },
      take: 30,
    }),
    prisma.opportunity.findMany({
      where: {
        tenantId,
        active: true,
        nextStepDue: { lt: todayStart },
        OR: [{ ownerId: userId }, { ownerId: null }],
      },
      include: { client: { select: { id: true, name: true } }, stage: true },
      orderBy: { nextStepDue: "asc" },
      take: 30,
    }),
    prisma.opportunity.findMany({
      where: {
        tenantId,
        active: true,
        nextStepDue: { gt: todayEnd, lte: new Date(now.getTime() + 7 * 86400000) },
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
      orderBy: { amount: "desc" },
      take: 20,
    }),
    prisma.contract.findMany({
      where: { tenantId, status: "ACTIVE" },
      include: {
        client: { select: { id: true, name: true } },
        variations: { select: { variationEndDate: true } },
      },
      take: 200,
    }),
    prisma.timesheet.count({
      where: {
        status: "DRAFT",
        endDate: { lt: todayStart },
        OR: [
          { project: { client: { tenantId } } },
          { opportunity: { tenantId } },
        ],
      },
    }),
  ]);

  const mapOpp = (o: (typeof dueTodayRows)[number], overdue: boolean) => ({
    id: o.id,
    name: o.name,
    nextStep: o.nextStep,
    nextStepDue: o.nextStepDue,
    kind: activityKind(o.nextStep),
    overdue,
    client: o.client,
    stage: o.stage?.name ?? null,
  });

  const burnAttention = contractsActive
    .map((c) => {
      const value = Number(c.contractValue) + Number(c.totalVariation);
      const consumed = Number(c.consumed);
      const pct = value > 0 ? consumed / value : 0;
      return { contract: c, pct };
    })
    .filter((x) => x.pct >= 0.8)
    .slice(0, 10);

  const contractsExpiring = contractsActive
    .map((c) => {
      const expiry = resolveContractExpiryDate(c.endDate, c.variations);
      return { contract: c, expiry };
    })
    .filter((x) => x.expiry && x.expiry >= todayStart && x.expiry <= in30Days)
    .sort((a, b) => (a.expiry!.getTime() - b.expiry!.getTime()))
    .slice(0, 20);

  return res.json({
    data: {
      dateLabel: now.toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      dueToday: [
        ...dueTodayRows.map((o) => mapOpp(o, false)),
        ...overdueRows.map((o) => mapOpp(o, true)),
      ],
      overdueNextSteps: overdueRows.map((o) => mapOpp(o, true)),
      dueSoon: dueSoonRows.map((o) => mapOpp(o, false)),
      newLeads: newLeads.map((l) => ({
        id: l.id,
        name: `${l.firstName} ${l.lastName}`.trim(),
        company: l.company,
        email: l.email,
        source: l.source,
        sourceLabel: leadSourceLabel(l.source),
        createdAt: l.createdAt,
      })),
      closingThisMonth: closingThisMonth.map((o) => ({
        id: o.id,
        name: o.name,
        amount: Number(o.amount),
        currency: o.currency,
        client: o.client,
        stage: o.stage?.name ?? null,
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
      moduleAlerts: {
        missingTimesheets: overdueDraftTimesheets,
        contractsExpiring: contractsExpiring.length,
        contractsExpiringList: contractsExpiring.map(({ contract: c, expiry }) => ({
          id: c.id,
          contractNumber: c.contractNumber,
          title: c.title,
          client: c.client,
          expiryDate: expiry!.toISOString(),
        })),
      },
    },
  });
});

export { router as crmMyDayRoutes };
