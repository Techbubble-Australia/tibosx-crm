import { prisma } from "@techbubble/database";

export async function getAdminUserCredentialAssignment(adminUserId: string) {
  return prisma.adminUserCredentialAssignment.findUnique({
    where: { adminUserId },
    include: { credentialTemplate: true },
  });
}
