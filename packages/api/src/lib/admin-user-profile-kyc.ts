import { prisma } from "@techbubble/database";
import { memberProfileDetailsComplete } from "./member-profile";

export const PROFILE_KYC_STATUS_INCOMPLETE = "INCOMPLETE";
export const PROFILE_KYC_STATUS_COMPLETE = "COMPLETE";

export type ProfileKycStatus =
  | typeof PROFILE_KYC_STATUS_INCOMPLETE
  | typeof PROFILE_KYC_STATUS_COMPLETE;

export function isProfileKycStatusComplete(status: string | null | undefined): boolean {
  return status === PROFILE_KYC_STATUS_COMPLETE;
}

/** Apply profile KYC status + completed timestamp from merged user profile fields. */
const kycProfileSelect = {
  id: true,
  profileKycStatus: true,
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
  taxNumber: true,
} as const;

/** If profile fields satisfy KYC but status is stale, persist COMPLETE (and vice versa). */
export async function syncAdminUserProfileKycStatus(userId: string) {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: kycProfileSelect,
  });
  if (!user) return null;
  const kyc = profileKycFieldsFromMergedProfile({
    ...user,
    profileDetailsCompletedAt: user.profileDetailsCompletedAt,
  });
  if (
    kyc.profileKycStatus === user.profileKycStatus &&
    (kyc.profileDetailsCompletedAt?.toISOString() ?? null) ===
      (user.profileDetailsCompletedAt?.toISOString() ?? null)
  ) {
    return user;
  }
  return prisma.adminUser.update({
    where: { id: userId },
    data: {
      profileKycStatus: kyc.profileKycStatus,
      profileDetailsCompletedAt: kyc.profileDetailsCompletedAt,
    },
    select: kycProfileSelect,
  });
}

export function profileKycFieldsFromMergedProfile(
  merged: {
    profileDetailsCompletedAt?: Date | null;
    profileKycStatus?: string | null;
  } & Parameters<typeof memberProfileDetailsComplete>[0],
): { profileKycStatus: ProfileKycStatus; profileDetailsCompletedAt: Date | null } {
  if (memberProfileDetailsComplete(merged)) {
    return {
      profileKycStatus: PROFILE_KYC_STATUS_COMPLETE,
      profileDetailsCompletedAt: merged.profileDetailsCompletedAt ?? new Date(),
    };
  }
  return {
    profileKycStatus: PROFILE_KYC_STATUS_INCOMPLETE,
    profileDetailsCompletedAt: null,
  };
}
