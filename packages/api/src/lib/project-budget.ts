import { prisma, type Prisma } from "@techbubble/database";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Contract-linked project budgets are derived, not edited:
 * - project from the contract itself → contract value (variations excluded; they get their own projects)
 * - project from a variation → that variation's value
 */
export async function syncProjectBudgetsForContract(contractId: string, db: Db = prisma) {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: {
      contractValue: true,
      currency: true,
      variations: { select: { id: true, variationValue: true } },
    },
  });
  if (!contract) return;

  await db.project.updateMany({
    where: { contractId, contractVariationId: null },
    data: { budget: contract.contractValue, budgetCurrency: contract.currency },
  });
  for (const variation of contract.variations) {
    await db.project.updateMany({
      where: { contractVariationId: variation.id },
      data: { budget: variation.variationValue, budgetCurrency: contract.currency },
    });
  }
}
