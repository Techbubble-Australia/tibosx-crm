import { prisma } from "@techbubble/database";
import { toNumber, toNumberOrNull } from "./decimal";
import { convertCurrency, getExchangeRatesFromBase } from "./exchange-rates";
import { generateProjectMonths } from "./project-types";
import { totalHoursByIsoDay, type DailyHours } from "./timesheet-entries";

/** Personnel estimates and timesheet actuals are stored in AUD after converting member rates. */
export const PROJECT_COST_CURRENCY = "AUD";

export const MEMBER_RATE_FREQUENCIES = ["HOURLY", "DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"] as const;
export type MemberRateFrequency = (typeof MEMBER_RATE_FREQUENCIES)[number];

const HOURS_PER_DAY = 8;

export function weekdaysInMonth(year: number, month: number): number {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  let count = 0;
  for (let day = 1; day <= last; day += 1) {
    const dow = new Date(Date.UTC(year, month, day)).getUTCDay();
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return count;
}

/** Monthly rates are spread over the weekdays of that calendar month. */
export function dailyRateFor(
  rate: number,
  frequency: string,
  year: number,
  month: number,
): number {
  switch (frequency) {
    case "HOURLY":
      return rate * HOURS_PER_DAY;
    case "WEEKLY":
      return rate / 5;
    case "FORTNIGHTLY":
      return rate / 10;
    case "MONTHLY": {
      const days = weekdaysInMonth(year, month);
      return days > 0 ? rate / days : 0;
    }
    default:
      return rate;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

type RatedMember = { rate: number; rateFrequency: string; rateCurrency: string };

function ratedMembers(
  rows: Array<{ rate: { toString(): string } | null; rateFrequency: string; rateCurrency: string }>,
): RatedMember[] {
  return rows
    .map((row) => ({
      rate: toNumberOrNull(row.rate) ?? 0,
      rateFrequency: row.rateFrequency,
      rateCurrency: row.rateCurrency || "AUD",
    }))
    .filter((row) => row.rate > 0);
}

/**
 * Working days per project month. From the contract: its work units, which are the total days for
 * everyone on the contract (`shared`). Otherwise: weekdays in the project range, worked by each member.
 */
async function projectMonthDays(project: {
  startDate: Date;
  endDate: Date;
  contractId: string | null;
  contractVariationId: string | null;
}): Promise<{ shared: boolean; months: Array<{ year: number; month: number; days: number }> }> {
  if (project.contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: project.contractId },
      select: {
        unit: true,
        workUnitMonths: { orderBy: [{ year: "asc" }, { month: "asc" }] },
        variations: { select: { id: true, unit: true } },
      },
    });
    if (contract) {
      const segmentKey = project.contractVariationId ?? "base";
      const variation = project.contractVariationId
        ? contract.variations.find((row) => row.id === project.contractVariationId)
        : null;
      const unit = variation?.unit ?? contract.unit;
      const rows = contract.workUnitMonths
        .filter((row) => row.segmentKey === segmentKey)
        .map((row) => {
          const units = toNumber(row.workUnits);
          return {
            year: row.year,
            month: row.month,
            days: unit === "HOUR" ? units / HOURS_PER_DAY : units,
          };
        })
        .filter((row) => row.days > 0);
      if (rows.length) return { shared: true, months: rows };
    }
  }
  return {
    shared: false,
    months: generateProjectMonths(project.startDate, project.endDate, "T_AND_M", "DAY").map((row) => ({
      year: row.year,
      month: row.month,
      days: row.qty,
    })),
  };
}

/**
 * Replaces personnel estimates with contract/project days × each member's daily-equivalent rate.
 * Member rates in other currencies are converted to AUD first, so the dashboard totals stay comparable.
 */
export async function runProjectEstimates(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      contractId: true,
      contractVariationId: true,
      members: { select: { rate: true, rateFrequency: true, rateCurrency: true } },
    },
  });
  if (!project) throw new Error("NOT_FOUND");

  const members = ratedMembers(project.members);
  if (!members.length) throw new Error("NO_MEMBER_RATES");

  const fx = await getExchangeRatesFromBase(PROJECT_COST_CURRENCY);
  const membersAud = members.map((member) => ({
    ...member,
    rate: convertCurrency(member.rate, member.rateCurrency, PROJECT_COST_CURRENCY, PROJECT_COST_CURRENCY, fx),
    rateCurrency: PROJECT_COST_CURRENCY,
  }));

  const { shared, months } = await projectMonthDays(project);
  const rows: Array<{ year: number; month: number; qty: number; currency: string; estimatedCost: number }> = [];
  for (const { year, month, days } of months) {
    // Contract days are split evenly across members; otherwise every member works every day.
    const memberDays = shared ? days / membersAud.length : days;
    let qty = 0;
    let cost = 0;
    for (const member of membersAud) {
      qty += memberDays;
      cost += memberDays * dailyRateFor(member.rate, member.rateFrequency, year, month);
    }
    rows.push({
      year,
      month,
      qty: round2(qty),
      currency: PROJECT_COST_CURRENCY,
      estimatedCost: round2(cost),
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectEstimate.deleteMany({ where: { projectId, costType: "personnel" } });
    if (rows.length) {
      await tx.projectEstimate.createMany({
        data: rows.map((row) => ({ ...row, projectId, costType: "personnel" })),
      });
    }
  });
  return rows.length;
}

export function addUtcDays(date: Date, days: number): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Rebuilds timesheet-sourced actuals from approved timesheets: hourly members are paid for the hours
 * logged; other rates count each day pro rata (8 hours = one day, at most one day per date).
 */
export async function syncProjectActualsFromTimesheets(projectId: string) {
  const [members, timesheets] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId, adminUserId: { not: null } },
      select: { adminUserId: true, rate: true, rateFrequency: true, rateCurrency: true },
    }),
    prisma.timesheet.findMany({
      where: { projectId, status: "APPROVED" },
      select: {
        memberUserId: true,
        startDate: true,
        dailyHours: true,
        entries: { select: { dailyHours: true } },
      },
    }),
  ]);

  const memberByUser = new Map(members.map((row) => [row.adminUserId!, row]));
  const fx = await getExchangeRatesFromBase(PROJECT_COST_CURRENCY);
  const totals = new Map<string, { year: number; month: number; currency: string; days: number; cost: number }>();

  for (const sheet of timesheets) {
    const member = memberByUser.get(sheet.memberUserId);
    const rawRate = toNumberOrNull(member?.rate ?? null) ?? 0;
    if (!member || rawRate <= 0) continue;
    const rate = convertCurrency(
      rawRate,
      member.rateCurrency || "AUD",
      PROJECT_COST_CURRENCY,
      PROJECT_COST_CURRENCY,
      fx,
    );

    const hourSources: DailyHours[] = sheet.entries.length
      ? sheet.entries.map((row) => (row.dailyHours ?? {}) as DailyHours)
      : [(sheet.dailyHours ?? {}) as DailyHours];

    totalHoursByIsoDay(sheet.startDate, hourSources).forEach((hours, iso) => {
      if (hours <= 0) return;
      const date = new Date(`${iso}T00:00:00.000Z`);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const bucketKey = `${year}-${month}-${PROJECT_COST_CURRENCY}`;
      const bucket = totals.get(bucketKey) ?? { year, month, currency: PROJECT_COST_CURRENCY, days: 0, cost: 0 };
      const dayFraction = Math.min(hours / HOURS_PER_DAY, 1);
      bucket.days += member.rateFrequency === "HOURLY" ? hours / HOURS_PER_DAY : dayFraction;
      bucket.cost +=
        member.rateFrequency === "HOURLY"
          ? hours * rate
          : dayFraction * dailyRateFor(rate, member.rateFrequency, year, month);
      totals.set(bucketKey, bucket);
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectActual.deleteMany({ where: { projectId, source: "timesheet" } });
    if (totals.size) {
      await tx.projectActual.createMany({
        data: [...totals.values()].map((row) => ({
          projectId,
          year: row.year,
          month: row.month,
          qty: round2(row.days),
          currency: row.currency,
          actualCost: round2(row.cost),
          costType: "personnel",
          source: "timesheet",
        })),
      });
    }
  });
}


/** Rebuilds personnel estimates in AUD after deploy; safe with several API instances. */
export async function rebuildPersonnelEstimatesOnStartup() {
  const rows = await prisma.$queryRawUnsafe<Array<{ locked: boolean }>>(
    `SELECT pg_try_advisory_lock(hashtext('project-estimates-to-aud-v1')) AS locked`,
  );
  if (!rows[0]?.locked) {
    console.log("⏭️  Skipping estimate rebuild (another instance holds the lock)");
    return;
  }

  try {
    const projects = await prisma.project.findMany({
      where: { members: { some: { rate: { not: null } } } },
      select: { id: true, projectNumber: true },
      orderBy: { projectNumber: "asc" },
    });
    let ok = 0;
    for (const project of projects) {
      try {
        await runProjectEstimates(project.id);
        await syncProjectActualsFromTimesheets(project.id);
        ok += 1;
      } catch (error) {
        if (error instanceof Error && (error.message === "NO_MEMBER_RATES" || error.message === "NOT_FOUND")) continue;
        console.error(`Estimate rebuild failed for ${project.projectNumber}:`, error);
      }
    }
    console.log(`💱 Rebuilt AUD personnel estimates for ${ok} project(s)`);
  } finally {
    await prisma.$queryRawUnsafe(`SELECT pg_advisory_unlock(hashtext('project-estimates-to-aud-v1'))`);
  }
}
