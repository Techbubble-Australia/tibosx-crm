import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;

  const [opps, leads, stages] = await Promise.all([
    prisma.opportunity.findMany({
      where: { tenantId },
      select: {
        id: true,
        amount: true,
        status: true,
        active: true,
        stageId: true,
        closeReason: true,
        createdAt: true,
      },
    }),
    prisma.lead.findMany({
      where: { tenantId },
      select: { id: true, source: true, status: true },
    }),
    prisma.crmStage.findMany({
      where: { pipeline: { tenantId } },
      select: { id: true, name: true, stageType: true, order: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const won = opps.filter((o) => o.status === "ACCEPTED" || stages.find((s) => s.id === o.stageId)?.stageType === "won");
  const lost = opps.filter((o) => o.status === "REJECTED" || stages.find((s) => s.id === o.stageId)?.stageType === "lost");
  const open = opps.filter((o) => o.active && !won.includes(o) && !lost.includes(o));

  const winRate = won.length + lost.length > 0 ? won.length / (won.length + lost.length) : 0;

  const bySource: Record<string, { total: number; converted: number }> = {};
  for (const lead of leads) {
    const src = lead.source || "unknown";
    if (!bySource[src]) bySource[src] = { total: 0, converted: 0 };
    bySource[src].total += 1;
    if (lead.status === "CONVERTED") bySource[src].converted += 1;
  }

  const lostReasons: Record<string, number> = {};
  for (const o of lost) {
    const reason = (o.closeReason || "Unspecified").trim() || "Unspecified";
    lostReasons[reason] = (lostReasons[reason] || 0) + 1;
  }

  const stageCounts = stages.map((s) => ({
    stageId: s.id,
    name: s.name,
    stageType: s.stageType,
    count: opps.filter((o) => o.stageId === s.id).length,
  }));

  const pipelineValue = open.reduce((sum, o) => sum + Number(o.amount), 0);
  const wonValue = won.reduce((sum, o) => sum + Number(o.amount), 0);

  return res.json({
    data: {
      tiles: {
        openDeals: open.length,
        wonDeals: won.length,
        lostDeals: lost.length,
        winRate,
        pipelineValue,
        wonValue,
        newLeads: leads.filter((l) => l.status === "NEW").length,
      },
      winRateBySource: Object.entries(bySource).map(([source, v]) => ({
        source,
        total: v.total,
        converted: v.converted,
        rate: v.total ? v.converted / v.total : 0,
      })),
      lostReasons: Object.entries(lostReasons).map(([reason, count]) => ({ reason, count })),
      stageConversion: stageCounts,
      savedReports: [
        { id: "stub-win-rate", name: "Win rate by source", kind: "built_in" },
        { id: "stub-lost", name: "Lost reasons", kind: "built_in" },
        { id: "stub-stage", name: "Stage conversion", kind: "built_in" },
      ],
    },
  });
});

export { router as crmReportRoutes };
