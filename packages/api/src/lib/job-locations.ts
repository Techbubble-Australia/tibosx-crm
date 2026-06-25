import { z } from "zod";

export const jobLocationEntrySchema = z.object({
  countryCode: z.string().length(2),
  country: z.string().min(1),
  flag: z.string().min(1),
  label: z.string().optional().default(""),
});

export type JobLocationEntry = z.infer<typeof jobLocationEntrySchema>;

export type JobLocationLegacyFields = {
  location?: string;
  country?: string;
  flag?: string;
  locations?: unknown;
};

export function parseJobLocations(raw: unknown): JobLocationEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: JobLocationEntry[] = [];
  for (const row of raw) {
    const parsed = jobLocationEntrySchema.safeParse(row);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/** Prefer stored `locations`; fall back to legacy single country/flag/location row. */
export function normalizeJobLocations(job: JobLocationLegacyFields): JobLocationEntry[] {
  const fromJson = parseJobLocations(job.locations);
  if (fromJson.length > 0) return fromJson;

  const country = job.country?.trim() ?? "";
  const flag = job.flag?.trim() ?? "";
  const location = job.location?.trim() ?? "";
  if (!country && !flag && !location) return [];

  return [
    {
      countryCode: "",
      country: country || location,
      flag,
      label: location && location !== country ? location : "",
    },
  ];
}

export function formatJobLocationsSummary(entries: readonly JobLocationEntry[]): {
  flags: string;
  locationText: string;
  countryKeys: string[];
} {
  const flags = entries
    .map((e) => e.flag.trim())
    .filter(Boolean)
    .join(" ");
  const locationText = entries
    .map((e) => e.label?.trim() || e.country.trim())
    .filter(Boolean)
    .join(" · ");
  const countryKeys = [
    ...new Set(
      entries
        .map((e) => (e.countryCode.trim() || e.country.trim()).toLowerCase())
        .filter(Boolean),
    ),
  ];
  return { flags, locationText, countryKeys };
}

export function syncLegacyLocationFields(entries: readonly JobLocationEntry[]): JobLocationLegacyFields {
  const normalized = entries.length > 0 ? entries : [];
  const { locationText } = formatJobLocationsSummary(normalized);
  const first = normalized[0];
  return {
    location: locationText || first?.country || "",
    country: normalized.map((e) => e.country.trim()).filter(Boolean).join(", "),
    flag: first?.flag?.trim() ?? "",
    locations: normalized,
  };
}

export function jobMatchesLocationFilter(
  entries: readonly JobLocationEntry[],
  filterKey: string,
): boolean {
  const key = filterKey.trim().toLowerCase();
  if (!key) return true;
  return entries.some((e) => {
    const code = e.countryCode.trim().toLowerCase();
    const country = e.country.trim().toLowerCase();
    return code === key || country === key;
  });
}

export function collectJobLocationFilterOptions(
  jobs: readonly { locations?: unknown; location?: string; country?: string; flag?: string }[],
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
