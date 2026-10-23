import { prisma } from "@techbubble/database";
import { isMemberConsultantProfileExempt } from "./admin-roles";
import {
  addressComplete,
  bankDetailsComplete,
  emergencyContactsComplete,
} from "./member-profile";
import { findUserCredentialAgreement } from "./project-member-user";

export type MemberOnboardingStatus = {
  hasAgreementAssignment: boolean;
  agreementSigned: boolean;
  profileComplete: boolean;
  canSubmitTimesheets: boolean;
  profileOnboardingRequired: boolean;
  inviteCount: number;
};

export async function getMemberOnboardingStatus(userId: string): Promise<MemberOnboardingStatus> {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      role: true,
      additionalRoles: true,
      profileDetailsCompletedAt: true,
      addressLine1: true,
      city: true,
      state: true,
      postcode: true,
      country: true,
      bankDetails: true,
      idProofUrl: true,
      addressProofUrl: true,
      emergencyContacts: true,
      profileOnboardingRequiredAt: true,
      inviteCount: true,
    },
  });

  const agreement = await findUserCredentialAgreement(userId);
  const hasAgreementAssignment = Boolean(agreement);
  const agreementSigned = !hasAgreementAssignment || Boolean(agreement?.agreementSignedAt);
  const consultantProfileExempt = user
    ? isMemberConsultantProfileExempt(user.role, user.additionalRoles)
    : false;
  const consultantProfileComplete = Boolean(
    user &&
      addressComplete(user) &&
      bankDetailsComplete(user.bankDetails) &&
      emergencyContactsComplete(user.emergencyContacts) &&
      Boolean(user.idProofUrl?.trim()) &&
      Boolean(user.addressProofUrl?.trim()),
  );
  const profileComplete = consultantProfileExempt || consultantProfileComplete;
  const canSubmitTimesheets = agreementSigned;
  const profileOnboardingRequired =
    !consultantProfileExempt &&
    Boolean(user?.profileOnboardingRequiredAt && !user.profileDetailsCompletedAt);

  if (consultantProfileExempt && user?.profileOnboardingRequiredAt) {
    await prisma.adminUser.update({
      where: { id: userId },
      data: { profileOnboardingRequiredAt: null },
    });
  }

  return {
    hasAgreementAssignment,
    agreementSigned,
    profileComplete,
    canSubmitTimesheets,
    profileOnboardingRequired,
    inviteCount: user?.inviteCount ?? 0,
  };
}
