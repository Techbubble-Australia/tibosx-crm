export const INVOICE_FIELD_LABELS: Record<string, string> = {
  reference: "Reference",
  issueDate: "Issue date",
  dueDate: "Due date",
  status: "Status",
  currency: "Currency",
  description: "Description",
  qty: "Quantity",
  rate: "Rate",
  amount: "Amount",
  taxRate: "Tax rate",
  taxAmount: "Tax amount",
  totalAmount: "Total amount",
  lineItems: "Line items",
  fileUrls: "Files",
};

export type InvoiceActivityLogEntry = {
  id: string;
  action: string;
  fieldName: string | null;
  fieldLabel: string | null;
  oldValue: string | null;
  newValue: string | null;
  performedByName: string;
  createdAt: string;
};

export function formatInvoiceActivitySummary(log: InvoiceActivityLogEntry): string {
  if (log.action === "CREATED") return "Invoice created";
  if (log.fieldName === "status" && log.oldValue && log.newValue) {
    return `Status changed from ${log.oldValue} to ${log.newValue}`;
  }
  if (log.action === "FIELD_UPDATED" && log.fieldLabel) {
    return `${log.fieldLabel} changed from ${log.oldValue ?? "—"} to ${log.newValue ?? "—"}`;
  }
  return log.action.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}
