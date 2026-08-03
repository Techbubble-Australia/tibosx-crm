export const SALARY_CURRENCIES = [
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "PHP", label: "PHP — Philippine Peso" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "NZD", label: "NZD — New Zealand Dollar" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
] as const;

export const SALARY_MODES = ["Hourly", "Daily", "Monthly", "Yearly"] as const;

export type SalaryMode = (typeof SALARY_MODES)[number];

export const JOB_LISTING_TYPES = ["Internal", "External for Client"] as const;

export type JobListingType = (typeof JOB_LISTING_TYPES)[number];

export function parseSalaryRateInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const value = Number(digits);
  return Number.isFinite(value) ? value : 0;
}

export function formatSalaryRateDisplay(raw: string): string {
  const value = parseSalaryRateInput(raw);
  if (value <= 0) return "";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatSalaryExpectation(
  currency: string,
  rate: number,
  mode: string,
): string {
  const formattedRate = new Intl.NumberFormat("en-US").format(rate);
  return `${currency} ${formattedRate} (${mode})`;
}
