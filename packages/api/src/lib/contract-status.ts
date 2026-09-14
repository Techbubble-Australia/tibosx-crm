export const CONTRACT_STATUSES = ["DRAFT", "ACTIVE", "EXPIRED", "CANCELED"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELED: "Canceled",
};
