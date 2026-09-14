export const CONTRACT_TYPES = ["FIXED_PRICE", "T_AND_M", "SUPPORT", "OTHER"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  FIXED_PRICE: "Fixed price",
  T_AND_M: "T&M",
  SUPPORT: "Support",
  OTHER: "Other",
};

export const CONTRACT_UNITS = ["HOUR", "DAY"] as const;
export type ContractUnit = (typeof CONTRACT_UNITS)[number];

export const CONTRACT_UNIT_LABELS: Record<ContractUnit, string> = {
  HOUR: "Hour",
  DAY: "Day",
};
