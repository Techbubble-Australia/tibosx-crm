export const CONTRACT_STATUSES = ["DRAFT", "ACTIVE", "EXPIRED", "CANCELED"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELED: "Canceled",
};

export const CONTRACT_STATUS_COLORS: Record<
  ContractStatus,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  DRAFT: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    darkBg: "dark:bg-gray-800",
    darkText: "dark:text-gray-300",
  },
  ACTIVE: {
    bg: "bg-green-50",
    text: "text-green-700",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-400",
  },
  EXPIRED: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-400",
  },
  CANCELED: {
    bg: "bg-red-50",
    text: "text-red-700",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
  },
};
