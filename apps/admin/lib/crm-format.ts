/** Format a CRM amount, e.g. A$412,500 (AUD) or USD 12,000 (other currencies). */
export function formatCrmMoney(amount: number, currency = "AUD"): string {
  const code = (currency || "AUD").toUpperCase();
  const n = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(amount || 0);
  return code === "AUD" ? `A$${n}` : `${code} ${n}`;
}

/** Compact board column totals, e.g. A$61k. */
export function formatCrmMoneyCompact(amount: number, currency = "AUD"): string {
  const code = (currency || "AUD").toUpperCase();
  const abs = Math.abs(amount || 0);
  if (abs >= 1000) {
    const k = Math.round(abs / 1000);
    const prefix = code === "AUD" ? "A$" : `${code} `;
    return `${amount < 0 ? "-" : ""}${prefix}${k}k`;
  }
  return formatCrmMoney(amount, currency);
}

/** Short en-AU date, e.g. "12 Dec". Returns "" for missing/invalid values. */
export function formatCrmShortDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/** "FIXED_PRICE" / "time_and_materials" -> "Fixed Price" / "Time And Materials". */
export function titleCaseToken(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
