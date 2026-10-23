import { prisma } from "@techbubble/database";

/** Bump invite counter when credentials are sent (KYC is controlled on the user record). */
export async function recordTbUserInvite(userId: string): Promise<void> {
  await prisma.adminUser.update({
    where: { id: userId },
    data: { inviteCount: { increment: 1 } },
  });
}
