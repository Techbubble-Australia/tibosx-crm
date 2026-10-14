import { COUNTRY_OPTIONS } from "@/lib/country-options";

export const COUNTRY_OTHER = "Other";

export function splitCountryValue(stored: string): { select: string; other: string } {
  const trimmed = stored.trim();
  if (!trimmed) return { select: "", other: "" };
  const known = COUNTRY_OPTIONS as readonly string[];
  if (known.includes(trimmed) && trimmed !== COUNTRY_OTHER) {
    return { select: trimmed, other: "" };
  }
  if (trimmed === COUNTRY_OTHER) {
    return { select: COUNTRY_OTHER, other: "" };
  }
  return { select: COUNTRY_OTHER, other: trimmed };
}

export function mergeCountryValue(select: string, other: string): string {
  if (select === COUNTRY_OTHER) {
    return other.trim();
  }
  return select.trim();
}
