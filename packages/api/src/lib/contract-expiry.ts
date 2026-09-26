import { prisma } from "@techbubble/database";
import { logContractStatusChange } from "./contract-activity";
import { releaseProfilesForEndedContract } from "./contract-profiles";
import { resolveContractExpiryDate } from "./sales-forecast";

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isValidEndDate(endDate: Date | null | undefined): boolean {
  if (!endDate) return false;
  return endDate.getUTCFullYear() >= 1971;
}

function isPastEndDate(endDate: Date): boolean {
  if (!isValidEndDate(endDate)) return false;
  const end = startOfUtcDay(endDate);
  const today = startOfUtcDay();
  return today > end;
}

/** Move ACTIVE contracts past their end date (or latest variation end) to EXPIRED. */
export async function expirePastDueContracts(): Promise<number> {
  const candidates = await prisma.contract.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      endDate: true,
      variations: {
        select: { variationEndDate: true },
      },
    },
  });

  const toExpire = candidates.filter((row) => {
    const expiryDate = resolveContractExpiryDate(row.endDate, row.variations);
    return expiryDate && isPastEndDate(expiryDate);
  });
  if (toExpire.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    for (const row of toExpire) {
      await tx.contract.update({
        where: { id: row.id },
        data: { status: "EXPIRED" },
      });
      await logContractStatusChange(tx, row.id, "AUTO_EXPIRED", "ACTIVE", "EXPIRED", null);
      await releaseProfilesForEndedContract(row.id, tx);
    }
  });

  return toExpire.length;
}
