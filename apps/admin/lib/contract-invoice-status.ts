export const CONTRACT_INVOICE_STATUSES = [
  "DRAFT",
  "AWAITING_PAYMENT",
  "PAID",
  "CANCELED",
] as const;

export type ContractInvoiceStatus = (typeof CONTRACT_INVOICE_STATUSES)[number];

export const CONTRACT_INVOICE_STATUS_LABELS: Record<ContractInvoiceStatus, string> = {
  DRAFT: "Draft",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  CANCELED: "Cancelled",
};

export const CONTRACT_INVOICE_STATUS_COLORS: Record<
  ContractInvoiceStatus,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  DRAFT: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    darkBg: "dark:bg-gray-800",
    darkText: "dark:text-gray-300",
  },
  AWAITING_PAYMENT: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-400",
  },
  PAID: {
    bg: "bg-green-50",
    text: "text-green-700",
    darkBg: "dark:bg-green-900/30",
    darkText: "dark:text-green-400",
  },
  CANCELED: {
    bg: "bg-red-50",
    text: "text-red-700",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
  },
};
