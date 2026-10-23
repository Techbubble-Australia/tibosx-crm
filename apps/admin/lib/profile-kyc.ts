export const PROFILE_KYC_STATUS_INCOMPLETE = "INCOMPLETE";
export const PROFILE_KYC_STATUS_COMPLETE = "COMPLETE";

export function profileKycStatusLabel(status: string | null | undefined): string {
  return status === PROFILE_KYC_STATUS_COMPLETE ? "Complete" : "Incomplete";
}

export function profileKycStatusBadgeClass(status: string | null | undefined): string {
  return status === PROFILE_KYC_STATUS_COMPLETE
    ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
    : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300";
}
