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
