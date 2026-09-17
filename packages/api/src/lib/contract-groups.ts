export const CONTRACT_ACTIVE_STATUSES = ["DRAFT", "ACTIVE"] as const;
export const CONTRACT_INACTIVE_STATUSES = ["EXPIRED", "CANCELED"] as const;

export const CONTRACT_MOVE_TO_DRAFT_REASONS = [
  "INCORRECT_CONTRACT_VALUE",
  "INCORRECT_RATE_VALUE",
  "ERROR_IN_TYPE",
  "OTHER",
] as const;

export type ContractMoveToDraftReason = (typeof CONTRACT_MOVE_TO_DRAFT_REASONS)[number];

export const CONTRACT_MOVE_TO_DRAFT_REASON_LABELS: Record<ContractMoveToDraftReason, string> = {
  INCORRECT_CONTRACT_VALUE: "Incorrect Contract value",
  INCORRECT_RATE_VALUE: "Incorrect rate value",
  ERROR_IN_TYPE: "Error in Type",
  OTHER: "Other",
};
