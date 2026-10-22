import { prisma, type Prisma } from "@techbubble/database";

async function countActiveContractAssignments(
  profileId: string,
  tx: Prisma.TransactionClient,
): Promise<number> {
  return tx.contractProfile.count({
    where: {
      profileId,
      contract: { status: "ACTIVE" },
    },
  });
}

export async function syncProfileAvailableFlag(profileId: string, tx: Prisma.TransactionClient) {
  const count = await countActiveContractAssignments(profileId, tx);
  await tx.candidateProfile.update({
    where: { id: profileId },
    data: { available: count === 0 },
  });
}

export async function releaseProfilesForEndedContract(contractId: string, tx: Prisma.TransactionClient) {
  const profiles = await tx.contractProfile.findMany({
    where: { contractId },
    select: { profileId: true },
  });
  for (const row of profiles) {
    await syncProfileAvailableFlag(row.profileId, tx);
  }
}

export function contractIsIncomplete(
  type: string,
  fileUrls: string[],
  profileCount: number,
  hasLinkedCareerApplication = false,
): boolean {
  if (!fileUrls.length) return true;
  if (type === "T_AND_M" && profileCount === 0 && !hasLinkedCareerApplication) return true;
  return false;
}
