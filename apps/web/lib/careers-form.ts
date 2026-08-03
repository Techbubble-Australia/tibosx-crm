export const SALARY_CURRENCIES = [
  { code: "AUD", label: "AUD" },
  { code: "USD", label: "USD" },
  { code: "GBP", label: "GBP" },
  { code: "EUR", label: "EUR" },
  { code: "INR", label: "INR" },
  { code: "PHP", label: "PHP" },
  { code: "AED", label: "AED" },
  { code: "NZD", label: "NZD" },
  { code: "SGD", label: "SGD" },
  { code: "CAD", label: "CAD" },
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

export type JobApplyOption = {
  title: string;
  countries: string[];
};

export function countriesForJobTitle(title: string, jobs: JobApplyOption[]): string {
  const match = jobs.find((j) => j.title === title);
  if (!match?.countries.length) return "";
  return match.countries.join(", ");
}
