import { prisma } from "@techbubble/database";

export type MemberOnboardingStatus = {
  hasAgreementAssignment: boolean;
  agreementSigned: boolean;
  profileComplete: boolean;
  canSubmitTimesheets: boolean;
};

export async function getMemberOnboardingStatus(userId: string): Promise<MemberOnboardingStatus> {
  const [user, member] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: userId },
      select: { profileDetailsCompletedAt: true },
    }),
    prisma.projectMember.findFirst({
      where: { adminUserId: userId, credentialTemplateId: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { agreementSignedAt: true },
    }),
  ]);

  const hasAgreementAssignment = Boolean(member);
  const agreementSigned = !member || Boolean(member.agreementSignedAt);
  const profileComplete = Boolean(user?.profileDetailsCompletedAt);
  const canSubmitTimesheets = agreementSigned && profileComplete;

  return {
    hasAgreementAssignment,
    agreementSigned,
    profileComplete,
    canSubmitTimesheets,
  };
}
