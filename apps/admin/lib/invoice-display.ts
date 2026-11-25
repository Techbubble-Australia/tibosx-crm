/** Shared display helpers for CRM invoice list / detail / contract pages. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PERIOD_IN_TEXT = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?,?\s+(20\d{2})\b/i;

/** "Nov 2026". Prefers a month named in the invoice text, otherwise the issue month. */
export function invoicePeriod(row: { description?: string | null; issueDate: string }): string {
  const match = PERIOD_IN_TEXT.exec(row.description ?? "");
  if (match?.[1] && match[2]) {
    const idx = MONTHS.findIndex((m) => m.toLowerCase() === match[1]!.slice(0, 3).toLowerCase());
    if (idx >= 0) return `${MONTHS[idx]} ${match[2]}`;
  }
  const d = new Date(row.issueDate);
  if (Number.isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "25 Nov" */
export function formatDayMonth(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

const PROVIDER_LABELS: Record<string, string> = {
  XERO: "Xero",
  MYOB: "MYOB",
  QUICKBOOKS: "QuickBooks",
  QBO: "QuickBooks",
};

/** Accounting sync pill label + Tailwind classes. */
export function accountingPill(status: string | null | undefined, provider?: string | null) {
  const key = (status ?? "NOT_SYNCED").toUpperCase();
  const providerLabel = provider ? PROVIDER_LABELS[provider.toUpperCase()] ?? provider : "";
  switch (key) {
    case "SYNCED":
      return {
        label: providerLabel ? `Synced to ${providerLabel}` : "Synced",
        className: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      };
    case "PENDING":
      return {
        label: "Sync pending",
        className: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      };
    case "ERROR":
      return {
        label: "Sync error",
        className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      };
    default:
      return {
        label: "Not sent",
        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      };
  }
}

/** Status chip classes matching the CRM wireframes (draft amber, awaiting blue, paid green). */
export function invoiceStatusChip(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "AWAITING_PAYMENT":
      return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "PAID":
      return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "CANCELED":
      return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}
