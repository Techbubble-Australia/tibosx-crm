import type { JobLocationEntry } from "@/lib/job-locations";
import { getCitiesForCountryCode } from "@/lib/country-cities";

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

export const OTHER_CITY_VALUE = "__other__";

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
  jobListingId?: string;
  locations: JobLocationEntry[];
};

export type CountryOption = {
  country: string;
  countryCode: string;
  flag: string;
};

export function countryOptionsForJob(title: string, jobs: JobApplyOption[]): CountryOption[] {
  const match = jobs.find((j) => j.title === title);
  if (!match) return [];
  const seen = new Set<string>();
  const out: CountryOption[] = [];
  for (const entry of match.locations) {
    const country = entry.country.trim();
    const code = entry.countryCode.trim().toUpperCase();
    const key = country.toLowerCase();
    if (!country || seen.has(key)) continue;
    seen.add(key);
    out.push({ country, countryCode: code, flag: entry.flag.trim() });
  }
  return out.sort((a, b) => a.country.localeCompare(b.country));
}

export function defaultCountryForJob(title: string, jobs: JobApplyOption[]): string {
  return countryOptionsForJob(title, jobs)[0]?.country ?? "";
}

export function cityOptionsForJobCountry(
  title: string,
  country: string,
  jobs: JobApplyOption[],
): string[] {
  const match = jobs.find((j) => j.title === title);
  if (!match || !country.trim()) return [];
  const normalizedCountry = country.trim().toLowerCase();
  const entry = match.locations.find((loc) => loc.country.trim().toLowerCase() === normalizedCountry);
  const fromJob = (entry?.cities ?? []).map((c) => c.trim()).filter(Boolean);
  const fromCatalog = entry?.countryCode ? [...getCitiesForCountryCode(entry.countryCode)] : [];
  const merged = [...new Set([...fromJob, ...fromCatalog])].sort((a, b) => a.localeCompare(b));
  return merged;
}

export function jobListingIdForTitle(title: string, jobs: JobApplyOption[]): string | undefined {
  return jobs.find((j) => j.title === title)?.jobListingId;
}

/** @deprecated Use countryOptionsForJob */
export function countriesForJobTitle(title: string, jobs: JobApplyOption[]): string {
  const options = countryOptionsForJob(title, jobs);
  if (!options.length) return "";
  return options.map((o) => o.country).join(", ");
}
