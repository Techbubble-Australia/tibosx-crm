import {
  addressComplete,
  bankDetailsComplete,
  emergencyContactsComplete,
} from "./member-profile";

export const PROFILE_KYC_STATUS_INCOMPLETE = "INCOMPLETE";
export const PROFILE_KYC_STATUS_COMPLETE = "COMPLETE";

export type ProfileKycStatus =
  | typeof PROFILE_KYC_STATUS_INCOMPLETE
  | typeof PROFILE_KYC_STATUS_COMPLETE;

export function isProfileKycStatusComplete(status: string | null | undefined): boolean {
  return status === PROFILE_KYC_STATUS_COMPLETE;
}

export function isConsultantKycProfileComplete(user: {
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  bankDetails?: unknown;
  idProofUrl?: string | null;
  addressProofUrl?: string | null;
  emergencyContacts?: unknown;
  taxNumber?: string | null;
}): boolean {
  return (
    addressComplete(user) &&
    bankDetailsComplete(user.bankDetails) &&
    emergencyContactsComplete(user.emergencyContacts) &&
    Boolean(user.idProofUrl?.trim()) &&
    Boolean(user.addressProofUrl?.trim()) &&
    Boolean(user.taxNumber?.trim())
  );
}

/** Apply profile KYC status + completed timestamp from merged user profile fields. */
export function profileKycFieldsFromMergedProfile(
  merged: {
    profileDetailsCompletedAt?: Date | null;
    profileKycStatus?: string | null;
  } & Parameters<typeof isConsultantKycProfileComplete>[0],
): { profileKycStatus: ProfileKycStatus; profileDetailsCompletedAt: Date | null } {
  if (isConsultantKycProfileComplete(merged)) {
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
