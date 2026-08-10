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

/** Must match packages/api/src/lib/validation.ts PHONE_REGEX */
export const PHONE_PATTERN = String.raw`^\+?[\d\s().-]{8,20}$`;
