/** Build API body from case study admin form (shared field names). */

export const CASE_STUDY_TEXT_FIELDS = [
  "slug",
  "title",
  "subtitle",
  "category",
  "clientName",
  "featuredImage",
  "heroStat1Value",
  "heroStat1Label",
  "heroStat2Value",
  "heroStat2Label",
  "heroStat3Value",
  "heroStat3Label",
  "backgroundTitle",
  "backgroundContent",
  "challengeTitle",
  "challengeContent",
  "challengeStat1Value",
  "challengeStat1Label",
  "challengeStat2Value",
  "challengeStat2Label",
  "challengeStat3Value",
  "challengeStat3Label",
  "problem1Title",
  "problem1Content",
  "problem2Title",
  "problem2Content",
  "problem3Title",
  "problem3Content",
  "problem4Title",
  "problem4Content",
  "solutionTitle",
  "solutionContent",
  "phase1Title",
  "phase1Duration",
  "phase1Content",
  "phase2Title",
  "phase2Duration",
  "phase2Content",
  "phase3Title",
  "phase3Duration",
  "phase3Content",
  "phase4Title",
  "phase4Duration",
  "phase4Content",
  "techStackTitle",
  "techStackIntro",
  "tech1Name",
  "tech1Description",
  "tech1Icon",
  "tech2Name",
  "tech2Description",
  "tech2Icon",
  "tech3Name",
  "tech3Description",
  "tech3Icon",
  "tech4Name",
  "tech4Description",
  "tech4Icon",
  "tech5Name",
  "tech5Description",
  "tech5Icon",
  "tech6Name",
  "tech6Description",
  "tech6Icon",
  "testimonialQuote",
  "testimonialAuthorName",
  "testimonialAuthorTitle",
  "testimonialAuthorCompany",
  "testimonialAuthorInitials",
  "resultsTitle",
  "resultsContent",
  "resultStat1Value",
  "resultStat1Label",
  "resultStat2Value",
  "resultStat2Label",
  "resultStat3Value",
  "resultStat3Label",
] as const;

export type CaseStudyFormRecord = Partial<Record<(typeof CASE_STUDY_TEXT_FIELDS)[number], string>> & {
  phase1Tags?: string[];
  phase2Tags?: string[];
  phase3Tags?: string[];
  phase4Tags?: string[];
  published?: boolean;
  featured?: boolean;
};

function splitTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function buildCaseStudyPayloadFromFormData(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of CASE_STUDY_TEXT_FIELDS) {
    out[key] = String(formData.get(key) ?? "");
  }
  out.phase1Tags = splitTags(formData.get("phase1Tags") as string | null);
  out.phase2Tags = splitTags(formData.get("phase2Tags") as string | null);
  out.phase3Tags = splitTags(formData.get("phase3Tags") as string | null);
  out.phase4Tags = splitTags(formData.get("phase4Tags") as string | null);
  out.published = formData.get("published") === "on";
  out.featured = formData.get("featured") === "on";
  return out;
}

export function emptyCaseStudyFormDefaults(): Record<string, string | boolean | string[]> {
  const out: Record<string, string | boolean | string[]> = {};
  for (const key of CASE_STUDY_TEXT_FIELDS) {
    out[key] = "";
  }
  out.phase1Tags = [];
  out.phase2Tags = [];
  out.phase3Tags = [];
  out.phase4Tags = [];
  out.published = true;
  out.featured = false;
  return out;
}
