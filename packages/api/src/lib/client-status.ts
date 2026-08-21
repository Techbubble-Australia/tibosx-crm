export const CLIENT_STATUSES = ["ACTIVE", "PROSPECT", "INACTIVE"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: "Active",
  PROSPECT: "Prospect",
  INACTIVE: "Inactive",
};

export const CLIENT_STATUS_COLORS: Record<
  ClientStatus,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  ACTIVE: {
    bg: "bg-green-50",
    text: "text-green-700",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-400",
  },
  PROSPECT: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-400",
  },
  INACTIVE: {
    bg: "bg-red-50",
    text: "text-red-700",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
  },
};
