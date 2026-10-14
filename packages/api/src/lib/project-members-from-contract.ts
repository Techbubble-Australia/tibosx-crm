import { prisma, type Prisma } from "@techbubble/database";
import { ensureProjectMemberRole } from "./admin-user-profile-map";

export async function addContractProfilesAsProjectMembers(
  tx: Prisma.TransactionClient,
  projectId: string,
  contractId: string,
): Promise<void> {
  const assignments = await tx.contractProfile.findMany({
    where: { contractId },
    select: {
      profileId: true,
      profile: {
        select: {
          mappedAdminUser: { select: { id: true } },
        },
      },
    },
  });

  for (const row of assignments) {
    const adminUserId = row.profile.mappedAdminUser?.id ?? null;
    await tx.projectMember.upsert({
      where: { projectId_profileId: { projectId, profileId: row.profileId } },
      create: { projectId, profileId: row.profileId, adminUserId },
      update: adminUserId ? { adminUserId } : {},
    });
    if (adminUserId) {
      await ensureProjectMemberRole(tx, adminUserId);
    }
  }
}
