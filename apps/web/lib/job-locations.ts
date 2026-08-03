import { resolveCountryCode } from "./resolve-country-code";

export type JobLocationEntry = {
  countryCode: string;
  country: string;
  flag: string;
  label?: string;
  cities?: string[];
};

export function formatLocationEntryDisplay(entry: JobLocationEntry): string {
  const cities = (entry.cities ?? []).map((c) => c.trim()).filter(Boolean);
  if (cities.length > 0) {
    return cities.join(" and ");
  }
  const label = entry.label?.trim() ?? "";
  if (label) return label;
  return entry.country.trim();
}

export type JobLocationLegacyFields = {
  location: string;
  country: string;
  flag: string;
  locations?: JobLocationEntry[];
};

function enrichLocationEntry(entry: JobLocationEntry): JobLocationEntry {
  const code = entry.countryCode?.trim().toLowerCase() ?? "";
  if (/^[a-z]{2}$/.test(code)) {
    return { ...entry, countryCode: code };
  }
  const resolved = resolveCountryCode(entry.flag, entry.country, entry.label);
  return resolved ? { ...entry, countryCode: resolved } : entry;
}

export function normalizeJobLocations(job: JobLocationLegacyFields): JobLocationEntry[] {
  if (Array.isArray(job.locations) && job.locations.length > 0) {
    return job.locations.map(enrichLocationEntry);
  }

  const country = job.country?.trim() ?? "";
  const flag = job.flag?.trim() ?? "";
  const location = job.location?.trim() ?? "";
  if (!country && !flag && !location) return [];

  const entry = enrichLocationEntry({
    countryCode: "",
    country: country || location,
    flag,
    label: location && location !== country ? location : "",
  });
  return [entry];
}

export function formatJobLocationsSummary(entries: readonly JobLocationEntry[]): {
  flags: string;
  locationText: string;
} {
  const flags = entries
    .map((e) => e.flag.trim())
    .filter(Boolean)
    .join(" ");
  const locationText = entries
    .map((e) => formatLocationEntryDisplay(e))
    .filter(Boolean)
    .join(" · ");
  return { flags, locationText };
}

export function formatJobMetaLine(
  job: JobLocationLegacyFields & { type: string; workMode: string },
): string {
  const entries = normalizeJobLocations(job);
  const { flags, locationText } = formatJobLocationsSummary(entries);
  const place = [flags, locationText].filter(Boolean).join(" ").trim();
  const formatType = (s: string) => {
    const t = s.trim();
    if (!t) return t;
    return t.replace(/\b\w/g, (c) => c.toUpperCase());
  };
  return [place, formatType(job.type), formatType(job.workMode)].filter(Boolean).join(" · ");
}

export function jobMatchesLocationFilter(job: JobLocationLegacyFields, filterKey: string): boolean {
  const key = filterKey.trim().toLowerCase();
  if (!key) return true;
  return normalizeJobLocations(job).some((e) => {
    const code = e.countryCode.trim().toLowerCase();
    const country = e.country.trim().toLowerCase();
    return code === key || country === key;
  });
}

export function collectJobLocationFilterOptions(
  jobs: readonly JobLocationLegacyFields[],
): { key: string; label: string; flag: string }[] {
  const seen = new Set<string>();
  const out: { key: string; label: string; flag: string }[] = [];

  for (const job of jobs) {
    for (const entry of normalizeJobLocations(job)) {
      const key = (entry.countryCode.trim() || entry.country.trim()).toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        label: entry.country.trim() || entry.label?.trim() || key,
        flag: entry.flag.trim(),
      });
    }
  }

  return out.sort((a, b) => a.label.localeCompare(b.label));
}
