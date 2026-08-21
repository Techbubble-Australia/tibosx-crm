import { z } from "zod";

/** ISO 3166-1 alpha-2 codes supported by public flag SVG assets. */
const EMOJI_TO_CODE: Record<string, string> = {
  "🇦🇺": "AU",
  "🇺🇸": "US",
  "🇮🇳": "IN",
  "🇵🇭": "PH",
  "🇬🇧": "GB",
  "🇦🇪": "AE",
};

const NAME_TO_CODE: Record<string, string> = {
  australia: "AU",
  usa: "US",
  us: "US",
  "united states": "US",
  "united states of america": "US",
  india: "IN",
  philippines: "PH",
  "united kingdom": "GB",
  uk: "GB",
  uae: "AE",
  "united arab emirates": "AE",
};

const PLACE_TO_CODE: Record<string, string> = {
  sydney: "AU",
  brisbane: "AU",
  melbourne: "AU",
  "north sydney": "AU",
  mumbai: "IN",
  bangalore: "IN",
  manila: "PH",
  london: "GB",
  dubai: "AE",
};

function resolveCountryCode(flag: string, countryOrPlace: string, placeLabel?: string): string {
  const f = flag.trim();
  if (f && EMOJI_TO_CODE[f]) return EMOJI_TO_CODE[f];

  const candidates = [countryOrPlace, placeLabel ?? ""]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  for (const key of candidates) {
    if (NAME_TO_CODE[key]) return NAME_TO_CODE[key];
    if (PLACE_TO_CODE[key]) return PLACE_TO_CODE[key];
    for (const part of key.split(/\s*(?:,|&|·|\/|\band\b)\s*/i)) {
      const p = part.trim();
      if (NAME_TO_CODE[p]) return NAME_TO_CODE[p];
      if (PLACE_TO_CODE[p]) return PLACE_TO_CODE[p];
    }
  }
  return "";
}

function enrichLocationEntry(entry: JobLocationEntry): JobLocationEntry {
  const code = entry.countryCode?.trim().toUpperCase() ?? "";
  if (/^[A-Z]{2}$/.test(code)) {
    return { ...entry, countryCode: code };
  }
  const resolved = resolveCountryCode(entry.flag, entry.country, entry.label);
  return resolved ? { ...entry, countryCode: resolved } : entry;
}

export const jobLocationEntrySchema = z.object({
  countryCode: z.string().min(0).default(""),
  country: z.string().min(1),
  flag: z.string().min(0).default(""),
  label: z.string().optional().default(""),
  cities: z.array(z.string()).optional().default([]),
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
    if (parsed.success) out.push(enrichLocationEntry(parsed.data));
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
    enrichLocationEntry({
      countryCode: "",
      country: country || location,
      flag,
      label: location && location !== country ? location : "",
      cities: [],
    }),
  ];
}

export function formatLocationEntryDisplay(entry: JobLocationEntry): string {
  const cities = (entry.cities ?? []).map((c) => c.trim()).filter(Boolean);
  if (cities.length > 0) {
    return cities.join(" and ");
  }
  const label = entry.label?.trim() ?? "";
  if (label) return label;
  return entry.country.trim();
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
    .map((e) => formatLocationEntryDisplay(e))
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
