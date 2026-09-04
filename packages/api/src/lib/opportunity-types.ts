export const OPPORTUNITY_TYPES = ["FIXED_PRICE", "T_AND_M", "SUPPORT", "OTHER"] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  FIXED_PRICE: "Fixed price",
  T_AND_M: "T&M",
  SUPPORT: "Support",
  OTHER: "Other",
};
