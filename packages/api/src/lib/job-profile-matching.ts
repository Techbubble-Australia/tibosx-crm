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
};

function normalizeTag(value: string): string {
  return value.trim().toLowerCase();
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
    const matchCount = matchedTags.length + (countryMatch ? 1 : 0);
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
    };
  });

  return scored
    .filter((row) => row.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || b.matchedTags.length - a.matchedTags.length)
    .slice(0, limit);
}
