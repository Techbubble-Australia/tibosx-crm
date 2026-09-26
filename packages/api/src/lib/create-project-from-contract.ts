import { prisma, type Prisma } from "@techbubble/database";
import { generateProjectMonths } from "./project-types";

type WorkUnitRow = { year: number; month: number; workUnits: number };
type MilestoneRow = { milestoneDate: Date; amount: Prisma.Decimal | number };

export function buildEstimatesFromContract(
  contract: {
    type: string;
    currency: string;
    rate: { toString(): string } | number;
  },
  workUnitMonths: WorkUnitRow[],
  milestones: MilestoneRow[],
  rateOverride?: number | null,
) {
  const currency = contract.currency;
  const rate =
    rateOverride != null
      ? rateOverride
      : typeof contract.rate === "number"
        ? contract.rate
        : Number(contract.rate.toString());

  if (contract.type === "T_AND_M" && workUnitMonths.length) {
    return workUnitMonths.map((row) => ({
      year: row.year,
      month: row.month,
      qty: row.workUnits,
      currency,
      estimatedCost: row.workUnits * rate,
      costType: "personnel" as const,
    }));
  }

  if (milestones.length) {
    return milestones.map((row) => ({
      year: row.milestoneDate.getUTCFullYear(),
      month: row.milestoneDate.getUTCMonth(),
      qty: 1,
      currency,
      estimatedCost:
        typeof row.amount === "number" ? row.amount : Number(row.amount.toString()),
      costType: "one-time" as const,
    }));
  }

  return [];
}

async function allocateProjectNumber(): Promise<string> {
  const rows = await prisma.project.findMany({ select: { projectNumber: true } });
  let max = 0;
  for (const row of rows) {
    const match = row.projectNumber.match(/^PRJ(\d+)$/i);
    if (match) max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
  }
  return `PRJ${String(max + 1).padStart(3, "0")}`;
}

async function replaceEstimates(
  tx: Prisma.TransactionClient,
  projectId: string,
  rows: ReturnType<typeof buildEstimatesFromContract>,
) {
  await tx.projectEstimate.deleteMany({ where: { projectId } });
  if (!rows.length) return;
  await tx.projectEstimate.createMany({
    data: rows.map((row) => ({
      projectId,
      year: row.year,
      month: row.month,
      qty: row.qty,
      currency: row.currency,
      estimatedCost: row.estimatedCost,
      costType: row.costType,
    })),
  });
}

function buildDefaultActuals(
  startDate: Date,
  endDate: Date,
  contract: { type: string; unit: string | null; currency: string },
) {
  const months = generateProjectMonths(startDate, endDate, contract.type, contract.unit);
  const currency = contract.currency;
  return months.map((row) => ({
    year: row.year,
    month: row.month,
    qty: row.qty,
    currency,
    actualCost: 0,
    costType: "personnel" as const,
  }));
}

async function replaceActuals(
  tx: Prisma.TransactionClient,
  projectId: string,
  rows: ReturnType<typeof buildDefaultActuals>,
) {
  await tx.projectActual.deleteMany({ where: { projectId } });
  if (!rows.length) return;
  await tx.projectActual.createMany({
    data: rows.map((row) => ({
      projectId,
      year: row.year,
      month: row.month,
      qty: row.qty,
      currency: row.currency,
      actualCost: row.actualCost,
      costType: row.costType,
    })),
  });
}

async function syncMembersFromContract(projectId: string, contractId: string) {
  const profiles = await prisma.contractProfile.findMany({
    where: { contractId },
    select: { profileId: true },
  });
  for (const row of profiles) {
    await prisma.projectMember.upsert({
      where: { projectId_profileId: { projectId, profileId: row.profileId } },
      create: { projectId, profileId: row.profileId },
      update: {},
    });
  }
}

export async function createProjectFromContract(
  contractId: string,
  projectManagerId: string,
  variationId?: string | null,
) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      milestones: { orderBy: { milestoneDate: "asc" } },
      workUnitMonths: { orderBy: [{ year: "asc" }, { month: "asc" }] },
      variations: true,
    },
  });
  if (!contract) throw new Error("NOT_FOUND");
  if (contract.status !== "ACTIVE") throw new Error("NOT_ACTIVE");

  const variation = variationId
    ? contract.variations.find((row) => row.id === variationId)
    : null;
  if (variationId && !variation) throw new Error("VARIATION_NOT_FOUND");

  const existing = await prisma.project.findFirst({
    where: {
      contractId,
      contractVariationId: variationId ?? null,
    },
  });
  if (existing) throw new Error("PROJECT_EXISTS");

  const segmentKey = variationId ?? "base";
  const workUnitMonths = contract.workUnitMonths
    .filter((row) => row.segmentKey === segmentKey)
    .map((row) => ({ year: row.year, month: row.month, workUnits: row.workUnits }));

  const rateOverride = variation?.rate
    ? Number(variation.rate.toString())
    : null;

  const estimates = buildEstimatesFromContract(
    contract,
    workUnitMonths,
    variationId ? [] : contract.milestones,
    rateOverride,
  );

  const startDate = variation?.variationDate ?? contract.startDate;
  const endDate =
    variation?.variationEndDate ??
    contract.endDate ??
    contract.startDate;

  const projectNumber = await allocateProjectNumber();

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        projectNumber,
        title: contract.title,
        description: contract.comments?.trim() || `Project for contract ${contract.contractNumber}`,
        clientId: contract.clientId,
        status: "DRAFT",
        projectManagerId,
        contractId,
        contractVariationId: variationId ?? null,
        startDate,
        endDate,
        fileUrls: Array.isArray(contract.fileUrls)
          ? (contract.fileUrls as string[]).filter((url) => typeof url === "string")
          : [],
      },
    });

    await replaceEstimates(tx, created.id, estimates);
    const actuals = buildDefaultActuals(startDate, endDate, {
      type: contract.type,
      unit: contract.unit,
      currency: contract.currency,
    });
    await replaceActuals(tx, created.id, actuals);

    await tx.projectActivityLog.create({
      data: {
        projectId: created.id,
        action: "CREATED",
        performedById: projectManagerId,
        newValue: contract.contractNumber,
      },
    });

    return created;
  });

  await syncMembersFromContract(project.id, contractId);
  return project;
}
