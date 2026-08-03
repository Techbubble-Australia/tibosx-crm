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

export function jobLocationsFromDefaults(defaults: JobLocationLegacyFields): JobLocationEntry[] {
  if (Array.isArray(defaults.locations) && defaults.locations.length > 0) {
    return defaults.locations;
  }

  const country = defaults.country?.trim() ?? "";
  const flag = defaults.flag?.trim() ?? "";
  const location = defaults.location?.trim() ?? "";
  if (!country && !flag && !location) {
    return [{ countryCode: "", country: "", flag: "", label: "" }];
  }

  return [
    {
      countryCode: resolveCountryCodeFromJob(flag, country),
      country,
      flag,
      label: location && location !== country ? location : "",
      cities: location && location !== country
        ? location.split(/\s*(?:,|&| and )\s*/i).map((s) => s.trim()).filter(Boolean)
        : [],
    },
  ];
}
