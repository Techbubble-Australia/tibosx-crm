import { resolveCountryCodeFromJob } from "@/lib/country-flags";

export type JobLocationEntry = {
  countryCode: string;
  country: string;
  flag: string;
  label?: string;
  cities?: string[];
};

export type JobLocationLegacyFields = {
  location?: string;
  country?: string;
  flag?: string;
  locations?: JobLocationEntry[];
};

export function jobLocationsFromDefaults(
  defaults: JobLocationLegacyFields & { city?: string | null },
): JobLocationEntry[] {
  if (Array.isArray(defaults.locations) && defaults.locations.length > 0) {
    return mergeCityIntoFirstLocation(defaults.locations, defaults.city);
  }

  const country = defaults.country?.trim() ?? "";
  const flag = defaults.flag?.trim() ?? "";
  const location = defaults.location?.trim() ?? "";
  if (!country && !flag && !location) {
    return [{ countryCode: "", country: "", flag: "", label: "" }];
  }

  const entry: JobLocationEntry = {
    countryCode: resolveCountryCodeFromJob(flag, country),
    country,
    flag,
    label: location && location !== country ? location : "",
    cities:
      location && location !== country
        ? location.split(/\s*(?:,|&| and )\s*/i).map((s) => s.trim()).filter(Boolean)
        : [],
  };

  return mergeCityIntoFirstLocation([entry], defaults.city);
}

function mergeCityIntoFirstLocation(
  entries: JobLocationEntry[],
  city?: string | null,
): JobLocationEntry[] {
  const rawCity = city?.trim();
  if (!rawCity || entries.length === 0) {
    return entries;
  }

  const first = entries[0];
  if (!first) {
    return entries;
  }

  const existing = (first.cities ?? []).map((c) => c.trim()).filter(Boolean);
  if (existing.length > 0) {
    return entries;
  }

  const fromCity = rawCity.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  const updatedFirst: JobLocationEntry = {
    countryCode: first.countryCode,
    country: first.country,
    flag: first.flag,
    label: "",
    cities: fromCity.length > 0 ? fromCity : [rawCity],
  };
  return [updatedFirst, ...entries.slice(1)];
}

/** Primary city for admin lists — first country's selected cities. */
export function derivePrimaryCityFromLocations(entries: readonly JobLocationEntry[]): string | null {
  const first = entries.find((row) => row.country.trim());
  if (!first) return null;

  const cities = (first.cities ?? []).map((c) => c.trim()).filter(Boolean);
  if (cities.length > 0) {
    const joined = cities.join(", ");
    return joined.length > 120 ? joined.slice(0, 120) : joined;
  }

  const label = first.label?.trim() ?? "";
  if (!label) return null;

  const parsed = label.split(/\s*(?:,|&| and )\s*/i).map((s) => s.trim()).filter(Boolean);
  if (parsed.length === 0) return null;

  const joined = parsed.join(", ");
  return joined.length > 120 ? joined.slice(0, 120) : joined;
}
