export const OPPORTUNITY_STATUSES = ["DRAFT", "PROPOSAL", "IN_PROGRESS", "ACCEPTED", "REJECTED"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  DRAFT: "Draft",
  PROPOSAL: "Proposal",
  IN_PROGRESS: "In progress",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const OPPORTUNITY_STATUS_COLORS: Record<
  OpportunityStatus,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  DRAFT: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    darkBg: "dark:bg-gray-800",
    darkText: "dark:text-gray-300",
  },
  PROPOSAL: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-400",
  },
  IN_PROGRESS: {
    bg: "bg-[#efe6dc]",
    text: "text-[#5c4033]",
    darkBg: "dark:bg-[#3d2b1f]",
    darkText: "dark:text-[#d4b896]",
  },
  ACCEPTED: {
    bg: "bg-green-50",
    text: "text-green-700",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-400",
  },
  REJECTED: {
    bg: "bg-red-50",
    text: "text-red-700",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
  },
};

export const SALES_CURRENCIES = [
  { code: "AUD", label: "AUD" },
  { code: "USD", label: "USD" },
  { code: "GBP", label: "GBP" },
  { code: "EUR", label: "EUR" },
  { code: "INR", label: "INR" },
] as const;
