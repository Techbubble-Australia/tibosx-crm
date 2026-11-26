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

function moneyAmount(value: { toString(): string } | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

function relativeWhen(iso: Date | string | null | undefined, now: Date) {
  if (!iso) return "";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const start = startOfLocalDay(now).getTime();
  const day = startOfLocalDay(d).getTime();
  if (day === start) {
    return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: false });
  }
  if (day === start - 86400000) return "Yesterday";
  if (day < start) {
    const days = Math.round((start - day) / 86400000);
    return `${days} day${days === 1 ? "" : "s"} late`;
  }
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/** Home widgets payload matching TIBOSX CRM Screens – 1 Home (widgets). */
router.get("/", async (req: AuthRequest, res) => {
  try {
    const tenantId = req.tenant!.tenantId;
    const userId = req.user!.id;
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const todayEnd = endOfLocalDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const in60Days = new Date(now.getTime() + 60 * 86400000);

    const [
      openOpps,
      wonThisMonth,
      overdueInvoices,
      renewals,
      followUpRows,
      openDeals,
      pendingQuotes,
      newLeads,
      openTickets,
    ] = await Promise.all([
      prisma.opportunity.findMany({
        where: {
          tenantId,
          active: true,
          NOT: { stage: { stageType: { in: ["won", "lost"] } } },
        },
        select: { id: true, amount: true },
      }),
      prisma.opportunity.findMany({
        where: {
          tenantId,
          active: true,
          stage: { stageType: "won" },
          updatedAt: { gte: monthStart },
        },
        select: { id: true, amount: true },
      }),
      prisma.contractInvoice.findMany({
        where: {
          tenantId,
          status: "AWAITING_PAYMENT",
          dueDate: { lt: todayStart },
        },
        include: {
          contract: { include: { client: { select: { name: true } } } },
        },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      prisma.contract.findMany({
        where: { tenantId, status: "ACTIVE" },
        include: {
          variations: { select: { variationEndDate: true } },
        },
        take: 200,
      }),
      prisma.opportunity.findMany({
        where: {
          tenantId,
          active: true,
          nextStepDue: { lte: todayEnd },
          OR: [{ ownerId: userId }, { ownerId: null }],
        },
        orderBy: { nextStepDue: "asc" },
        take: 10,
      }),
      prisma.opportunity.findMany({
        where: {
          tenantId,
          active: true,
          NOT: { stage: { stageType: { in: ["won", "lost"] } } },
        },
        select: {
          id: true,
          name: true,
          nextStep: true,
          nextStepDue: true,
          updatedAt: true,
        },
        take: 80,
      }),
      prisma.quote.findMany({
        where: { tenantId, status: "SENT" },
        select: { id: true, quoteNumber: true, totalAmount: true },
        take: 10,
      }),
      prisma.lead.findMany({
        where: {
          tenantId,
          status: "NEW",
          createdAt: { gte: new Date(now.getTime() - 14 * 86400000) },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.ticket
        .findMany({
          where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
          orderBy: { updatedAt: "desc" },
          take: 10,
        })
        .catch(() => []),
    ]);

    const renewalsIn60 = renewals
      .map((c) => {
        const expiry = resolveContractExpiryDate(c.endDate, c.variations);
        const value = moneyAmount(c.contractValue) + moneyAmount(c.totalVariation);
        return { expiry, value };
      })
      .filter((x) => x.expiry && x.expiry >= todayStart && x.expiry <= in60Days);

    const dealsAttention: Array<{ id: string; title: string; detail: string; href: string }> = [];
    const seen = new Set<string>();
    for (const o of openDeals) {
      if (!o.nextStep?.trim()) {
        seen.add(o.id);
        dealsAttention.push({
          id: o.id,
          title: o.name,
          detail: "No next step",
          href: `/opportunities/${o.id}`,
        });
      }
    }
    for (const o of openDeals) {
      if (seen.has(o.id)) continue;
      if (o.nextStepDue && o.nextStepDue < todayStart) {
        seen.add(o.id);
        dealsAttention.push({
          id: o.id,
          title: o.name,
          detail: "Close date passed",
          href: `/opportunities/${o.id}`,
        });
      }
    }
    for (const o of openDeals) {
      if (seen.has(o.id)) continue;
      const days = Math.round((now.getTime() - o.updatedAt.getTime()) / 86400000);
      if (days >= 14) {
        seen.add(o.id);
        dealsAttention.push({
          id: o.id,
          title: o.name,
          detail: `Stalled ${days} days`,
          href: `/opportunities/${o.id}`,
        });
      }
    }

    const tickets = Array.isArray(openTickets) ? openTickets : [];

    return res.json({
      data: {
        dateLabel: now.toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        kpis: {
          openPipeline: {
            amount: openOpps.reduce((s, o) => s + moneyAmount(o.amount), 0),
            deals: openOpps.length,
          },
          wonThisMonth: {
            amount: wonThisMonth.reduce((s, o) => s + moneyAmount(o.amount), 0),
            deals: wonThisMonth.length,
          },
          overdueInvoices: {
            amount: overdueInvoices.reduce((s, i) => s + moneyAmount(i.totalAmount), 0),
            count: overdueInvoices.length,
          },
          renewals60: {
            count: renewalsIn60.length,
            amount: renewalsIn60.reduce((s, r) => s + r.value, 0),
          },
        },
        followUps: followUpRows.map((o) => ({
          id: o.id,
          title: o.nextStep?.trim() || o.name,
          detail:
            o.nextStepDue && o.nextStepDue < todayStart
              ? "Overdue"
              : relativeWhen(o.nextStepDue, now) || "Today",
          href: `/opportunities/${o.id}`,
        })),
        dealsAttention: dealsAttention.slice(0, 8),
        waitingApproval: pendingQuotes.map((q) => ({
          id: q.id,
          title: `Quote ${q.quoteNumber} $${Math.round(moneyAmount(q.totalAmount)).toLocaleString("en-AU")}`,
          detail: "Awaiting response",
          href: `/quotes/${q.id}`,
        })),
        invoicesChase: overdueInvoices.slice(0, 8).map((i) => {
          const due = i.dueDate ? startOfLocalDay(i.dueDate).getTime() : todayStart.getTime();
          const days = Math.max(1, Math.round((todayStart.getTime() - due) / 86400000));
          const clientName = i.contract?.client?.name ?? "";
          return {
            id: i.id,
            title: `${i.invoiceNumber}${clientName ? ` ${clientName}` : ""}`,
            detail: `${days} days late`,
            href: `/invoices/${i.id}`,
          };
        }),
        newLeads: newLeads.map((l) => {
          const source = (l.source || "Lead").replace(/_/g, " ");
          const lower = source.toLowerCase();
          const label = lower.includes("web")
            ? "Web form"
            : lower.includes("import")
              ? "Import"
              : lower.includes("refer")
                ? "Referral"
                : source;
          return {
            id: l.id,
            title: `${label}: ${l.company || `${l.firstName} ${l.lastName}`.trim()}`,
            detail: relativeWhen(l.createdAt, now) || "Recently",
            href: `/leads?highlight=${encodeURIComponent(l.id)}`,
          };
        }),
        supportRequests: tickets.slice(0, 8).map((t) => ({
          id: t.id,
          title: t.subject || `Ticket #${t.ticketNumber}`,
          detail: String(t.status || "Open"),
          href: `/support-tickets/${t.id}`,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching home widgets:", error);
    res.status(500).json({ error: "Failed to fetch home widgets" });
  }
});

export { router as crmHomeWidgetsRoutes };
