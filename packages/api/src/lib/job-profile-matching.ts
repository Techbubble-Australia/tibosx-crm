type JobForMatch = {
  country: string;
  locations: unknown;
  metaTags: string[];
};

type ProfileForMatch = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  category: string;
  technology: string;
  level: string;
  comments: string | null;
  resumeText: string | null;
  available: boolean;
  availableFrom: Date | null;
};

export type ProfileMatchResult = {
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  category: string;
  technology: string;
  matchCount: number;
  matchedTags: string[];
  countryMatch: boolean;
  available: boolean;
  availableFrom: string | null;
};

function normalizeTag(value: string): string {
  return value.trim().toLowerCase();
}

/** When `metaTags` is present on the query (even empty), use it; otherwise use saved job tags. */
export function resolveJobMetaTagsForMatch(
  query: Record<string, unknown>,
  jobMetaTags: string[],
): string[] {
  if (!Object.prototype.hasOwnProperty.call(query, "metaTags")) {
    return jobMetaTags.map((tag) => tag.trim()).filter(Boolean);
  }
  const raw = query.metaTags;
  if (raw === undefined || raw === null) return [];
  if (typeof raw === "string") {
    if (!raw.trim()) return [];
    return raw.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  if (Array.isArray(raw)) {
    return raw
      .flatMap((part) => String(part).split(","))
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function jobCountries(job: JobForMatch): Set<string> {
  const countries = new Set<string>();
  if (job.country.trim()) countries.add(normalizeTag(job.country));
  if (Array.isArray(job.locations)) {
    for (const entry of job.locations) {
      if (entry && typeof entry === "object" && "country" in entry) {
        const country = (entry as { country?: string }).country;
        if (typeof country === "string" && country.trim()) {
          countries.add(normalizeTag(country));
        }
      }
    }
  }
  return countries;
}

function profileSearchText(profile: ProfileForMatch): string {
  return [
    profile.category,
    profile.technology,
    profile.level,
    profile.comments ?? "",
    profile.resumeText ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export function matchProfilesToJob(
  job: JobForMatch,
  profiles: ProfileForMatch[],
  limit = 20,
): ProfileMatchResult[] {
  const tags = job.metaTags.map(normalizeTag).filter(Boolean);
  const jobCountrySet = jobCountries(job);

  const scored = profiles.map((profile) => {
    const countryMatch =
      jobCountrySet.size === 0 ||
      (profile.country.trim() && jobCountrySet.has(normalizeTag(profile.country)));
    const haystack = profileSearchText(profile);
    const matchedTags = tags.filter((tag) => haystack.includes(tag));
    const matchCount =
      tags.length > 0
        ? matchedTags.length
        : matchedTags.length + (countryMatch ? 1 : 0);
    return {
      profileId: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      country: profile.country,
      category: profile.category,
      technology: profile.technology,
      matchCount,
      matchedTags,
      countryMatch: Boolean(countryMatch),
      available: profile.available !== false,
      availableFrom: profile.availableFrom ? profile.availableFrom.toISOString() : null,
    };
  });

  return scored
    .filter((row) => {
      if (tags.length > 0) {
        return row.matchedTags.length > 0;
      }
      return row.matchCount > 0;
    })
    .sort((a, b) => b.matchCount - a.matchCount || b.matchedTags.length - a.matchedTags.length)
    .slice(0, limit);
}
