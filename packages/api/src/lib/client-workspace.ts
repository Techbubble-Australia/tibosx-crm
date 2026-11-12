import { prisma } from "@techbubble/database";
import { toNumber } from "./decimal";
import { invoiceFiles } from "./invoice-lines";
import { sumDailyHours, type DailyHours } from "./timesheet-entries";
import { resolveLinkedTbosClientPortalIdentity } from "../ticketing/lib/client-portal-identity";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ClientWorkspaceAccess = {
  /** Projects the user is linked to as a client contact (portal access or timesheet approver). */
  linkedProjects: Array<{ id: string; clientId: string }>;
  /** Linked to at least one project that accepts client support tickets. */
  ticketAccess: boolean;
};

export async function clientWorkspaceAccess(tbosUserId: string): Promise<ClientWorkspaceAccess> {
  const identity = await resolveLinkedTbosClientPortalIdentity(tbosUserId);
  if (!identity.contactIds.length && !identity.contactEmails.length) {
    return { linkedProjects: [], ticketAccess: false };
  }
  const contactWhere = {
    OR: [
      ...(identity.contactIds.length ? [{ id: { in: identity.contactIds } }] : []),
      ...identity.contactEmails.map((email) => ({ email: { equals: email, mode: "insensitive" as const } })),
    ],
  };
  const links = await prisma.projectClientContact.findMany({
    where: { contact: contactWhere, OR: [{ portalAccess: true }, { canApproveTimesheets: true }] },
    select: {
      portalAccess: true,
      project: { select: { id: true, clientId: true, status: true, kind: true, clientTicketsEnabled: true } },
    },
  });
  const linkedProjects = [...new Map(links.map((l) => [l.project.id, { id: l.project.id, clientId: l.project.clientId }])).values()];
  const ticketAccess = links.some(
    (l) => l.portalAccess && l.project.status === "ACTIVE" && l.project.kind === "SUPPORT" && l.project.clientTicketsEnabled,
  );
  return { linkedProjects, ticketAccess };
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Australian financial year start (1 July) on or before `today`. */
function financialYearStart(today: Date): Date {
  const year = today.getUTCMonth() >= 6 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
  return new Date(Date.UTC(year, 6, 1));
}

function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function sheetHours(sheet: { dailyHours: unknown; entries: Array<{ dailyHours: unknown }> }): number {
  const total = sheet.entries.length
    ? sheet.entries.reduce((sum, e) => sum + sumDailyHours((e.dailyHours ?? {}) as DailyHours), 0)
    : sumDailyHours((sheet.dailyHours ?? {}) as DailyHours);
  return Math.round(total * 100) / 100;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Everything shown on the Client workspace page for one or more clients. Invoices and payments always
 * cover the whole client; with `projectIds` the projects and timesheets are limited to those projects.
 * Totals use `currency` when the invoices include it, otherwise the most common invoice currency.
 */
export async function buildClientWorkspaceOverview(
  clientIds: string[],
  options: { projectIds?: string[]; currency?: string } = {},
  now = new Date(),
) {
  const today = startOfUtcDay(now);
  const fyStart = financialYearStart(today);
  const currentMonth = monthKey(today);
  const previousMonth = monthKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)));

  const [projects, invoices] = await Promise.all([
    prisma.project.findMany({
      where: {
        clientId: { in: clientIds },
        status: { in: ["ACTIVE", "ON_HOLD", "COMPLETED"] },
        ...(options.projectIds ? { id: { in: options.projectIds } } : {}),
      },
      select: {
        id: true,
        projectNumber: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        members: {
          select: { profile: { select: { firstName: true } }, adminUser: { select: { name: true } } },
        },
      },
    }),
    prisma.contractInvoice.findMany({
      where: { contract: { clientId: { in: clientIds } }, status: { not: "CANCELED" }, issueDate: { gte: fyStart } },
      orderBy: [{ issueDate: "desc" }, { invoiceNumber: "desc" }],
      select: {
        id: true,
        invoiceNumber: true,
        reference: true,
        issueDate: true,
        dueDate: true,
        status: true,
        currency: true,
        totalAmount: true,
        fileUrl: true,
        fileUrls: true,
        contract: { select: { title: true, client: { select: { name: true } } } },
      },
    }),
  ]);

  // Projects
  const projectRows = projects
    .map((p) => {
      const ended = p.status === "COMPLETED" || p.endDate < today;
      const totalMs = Math.max(p.endDate.getTime() - p.startDate.getTime(), DAY_MS);
      const progress = Math.min(100, Math.max(0, Math.round(((today.getTime() - p.startDate.getTime()) / totalMs) * 100)));
      const remainingDays = Math.ceil((startOfUtcDay(p.endDate).getTime() - today.getTime()) / DAY_MS);
      const members = p.members
        .map((m) => m.adminUser?.name?.trim() || m.profile.firstName)
        .filter(Boolean);
      return {
        id: p.id,
        projectNumber: p.projectNumber,
        title: p.title,
        members,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        progress: ended ? 100 : progress,
        remainingDays: ended ? null : Math.max(remainingDays, 0),
        state: ended ? ("ENDED" as const) : p.status === "ON_HOLD" ? ("ON_HOLD" as const) : ("IN_PROGRESS" as const),
      };
    })
    .sort((a, b) => {
      const rank = { IN_PROGRESS: 0, ON_HOLD: 1, ENDED: 2 };
      return rank[a.state] - rank[b.state] || b.endDate.localeCompare(a.endDate);
    });
  const inProgress = projectRows.filter((p) => p.state === "IN_PROGRESS").length;
  const ended = projectRows.filter((p) => p.state === "ENDED").length;

  // Timesheets
  const projectIds = projects.map((p) => p.id);
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const sheets = projectIds.length
    ? await prisma.timesheet.findMany({
        where: {
          projectId: { in: projectIds },
          status: { in: ["SUBMITTED", "APPROVED"] },
          OR: [
            { status: "SUBMITTED" },
            { startDate: { gte: new Date(`${previousMonth}-01T00:00:00.000Z`) } },
          ],
        },
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          projectId: true,
          startDate: true,
          status: true,
          dailyHours: true,
          entries: { select: { dailyHours: true } },
          memberUser: { select: { name: true, email: true } },
        },
      })
    : [];
  const timesheetRows = sheets.map((s) => {
    const project = projectById.get(s.projectId!)!;
    return {
      id: s.id,
      month: monthKey(s.startDate),
      projectNumber: project.projectNumber,
      projectTitle: project.title,
      member: s.memberUser.name?.trim() || s.memberUser.email,
      hours: sheetHours(s),
      status: s.status,
    };
  });
  const awaiting = timesheetRows.filter((t) => t.status === "SUBMITTED");
  const approvedRecent = timesheetRows.filter(
    (t) => t.status === "APPROVED" && (t.month === currentMonth || t.month === previousMonth),
  );

  // Invoices (issued this financial year; drafts only feed the chart)
  const currencyCount = new Map<string, number>();
  for (const inv of invoices) currencyCount.set(inv.currency, (currencyCount.get(inv.currency) ?? 0) + 1);
  const currencies = [...currencyCount.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const currency =
    options.currency && currencyCount.has(options.currency) ? options.currency : (currencies[0] ?? "AUD");
  const sent = invoices.filter((inv) => inv.status !== "DRAFT");
  const inCurrency = sent.filter((inv) => inv.currency === currency);
  const sum = (rows: typeof invoices) => round2(rows.reduce((total, inv) => total + toNumber(inv.totalAmount), 0));
  const awaitingPayment = inCurrency.filter((inv) => inv.status === "AWAITING_PAYMENT");
  const overdue = awaitingPayment.filter((inv) => inv.dueDate < today);
  const dueThisMonth = awaitingPayment.filter((inv) => monthKey(inv.dueDate) === currentMonth);
  const paid = inCurrency.filter((inv) => inv.status === "PAID");

  const chartMonths = [5, 4, 3, 2, 1, 0].map((back) =>
    monthKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - back, 1))),
  );
  const chart = chartMonths.map((month) => {
    const rows = invoices.filter((inv) => inv.currency === currency && monthKey(inv.issueDate) === month);
    return {
      month,
      paid: sum(rows.filter((inv) => inv.status === "PAID")),
      awaiting: sum(rows.filter((inv) => inv.status === "AWAITING_PAYMENT")),
      draft: sum(rows.filter((inv) => inv.status === "DRAFT")),
    };
  });

  const documents = sent.flatMap((inv) =>
    invoiceFiles(inv).map((file) => ({ name: file.name, url: file.url, invoiceNumber: inv.invoiceNumber })),
  );

  return {
    today: today.toISOString(),
    financialYearStart: fyStart.toISOString(),
    currency,
    currencies,
    kpis: {
      projectsInProgress: inProgress,
      projectsEnded: ended,
      timesheetsAwaiting: { count: awaiting.length, hours: round2(awaiting.reduce((h, t) => h + t.hours, 0)) },
      awaitingPayment: { amount: sum(awaitingPayment), count: awaitingPayment.length },
      overdue: { amount: sum(overdue), count: overdue.length },
      dueThisMonth: { amount: sum(dueThisMonth), count: dueThisMonth.length },
      paidThisYear: { amount: sum(paid), invoiced: sum(inCurrency) },
    },
    chart,
    invoices: sent.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      contractTitle: inv.contract.title,
      clientName: inv.contract.client.name,
      reference: inv.reference,
      issueDate: inv.issueDate.toISOString(),
      dueDate: inv.dueDate.toISOString(),
      currency: inv.currency,
      amount: toNumber(inv.totalAmount),
      balance: inv.status === "AWAITING_PAYMENT" ? toNumber(inv.totalAmount) : 0,
      status: inv.status,
      overdue: inv.status === "AWAITING_PAYMENT" && inv.dueDate < today,
      files: invoiceFiles(inv),
    })),
    projects: projectRows,
    timesheets: [...awaiting, ...approvedRecent],
    documents,
  };
}
