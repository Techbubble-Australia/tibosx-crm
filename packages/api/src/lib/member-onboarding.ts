import { prisma } from "@techbubble/database";
import { isProfileKycStatusComplete } from "./admin-user-profile-kyc";
import { findUserCredentialAgreement } from "./project-member-user";

export type MemberOnboardingStatus = {
  hasAgreementAssignment: boolean;
  agreementSigned: boolean;
  profileComplete: boolean;
  canSubmitTimesheets: boolean;
  profileOnboardingRequired: boolean;
  requireProfileAfterFirstLogin: boolean;
  profileKycStatus: string;
  inviteCount: number;
};

export async function getMemberOnboardingStatus(userId: string): Promise<MemberOnboardingStatus> {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      requireProfileAfterFirstLogin: true,
      profileKycStatus: true,
      inviteCount: true,
    },
  });

  const agreement = await findUserCredentialAgreement(userId);
  const hasAgreementAssignment = Boolean(agreement);
  const agreementSigned = !hasAgreementAssignment || Boolean(agreement?.agreementSignedAt);

  const requireProfileAfterFirstLogin = user?.requireProfileAfterFirstLogin ?? true;
  const profileKycStatus = user?.profileKycStatus ?? "INCOMPLETE";
  const profileComplete =
    !requireProfileAfterFirstLogin || isProfileKycStatusComplete(profileKycStatus);
  const profileOnboardingRequired =
    requireProfileAfterFirstLogin && !isProfileKycStatusComplete(profileKycStatus);
  const canSubmitTimesheets = agreementSigned;

  return {
    hasAgreementAssignment,
    agreementSigned,
    profileComplete,
    canSubmitTimesheets,
    profileOnboardingRequired,
    requireProfileAfterFirstLogin,
    profileKycStatus,
    inviteCount: user?.inviteCount ?? 0,
  };
}
