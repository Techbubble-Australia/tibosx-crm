import { prisma } from "@techbubble/database";
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
  const profileComplete = Boolean(
    user &&
      addressComplete(user) &&
      bankDetailsComplete(user.bankDetails) &&
      emergencyContactsComplete(user.emergencyContacts) &&
      Boolean(user.idProofUrl?.trim()) &&
      Boolean(user.addressProofUrl?.trim()),
  );
  const canSubmitTimesheets = agreementSigned && profileComplete;
  const profileOnboardingRequired = Boolean(
    user?.profileOnboardingRequiredAt && !user.profileDetailsCompletedAt,
  );

  return {
    hasAgreementAssignment,
    agreementSigned,
    profileComplete,
    canSubmitTimesheets,
    profileOnboardingRequired,
    inviteCount: user?.inviteCount ?? 0,
  };
}
