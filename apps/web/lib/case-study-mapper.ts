import { resolveMediaUrl } from "@/lib/media-url";

/** Flat API payload from GET /api/case-studies/slug/:slug */
export type CaseStudyApiRecord = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  clientName: string;
  heroStat1Value: string;
  heroStat1Label: string;
  heroStat2Value: string;
  heroStat2Label: string;
  heroStat3Value: string;
  heroStat3Label: string;
  featuredImage: string;
  bannerImage: string;
  contentImage: string;
  backgroundTitle: string;
  backgroundContent: string;
  challengeTitle: string;
  challengeContent: string;
  challengeStat1Value: string;
  challengeStat1Label: string;
  challengeStat2Value: string;
  challengeStat2Label: string;
  challengeStat3Value: string;
  challengeStat3Label: string;
  problem1Title: string;
  problem1Content: string;
  problem2Title: string;
  problem2Content: string;
  problem3Title: string;
  problem3Content: string;
  problem4Title: string;
  problem4Content: string;
  solutionTitle: string;
  solutionContent: string;
  phase1Title: string;
  phase1Duration: string;
  phase1Content: string;
  phase1Tags: string[];
  phase2Title: string;
  phase2Duration: string;
  phase2Content: string;
  phase2Tags: string[];
  phase3Title: string;
  phase3Duration: string;
  phase3Content: string;
  phase3Tags: string[];
  phase4Title: string | null;
  phase4Duration: string | null;
  phase4Content: string | null;
  phase4Tags: string[];
  techStackTitle: string;
  techStackIntro: string;
  tech1Name: string;
  tech1Description: string;
  tech1Icon: string;
  tech2Name: string;
  tech2Description: string;
  tech2Icon: string;
  tech3Name: string;
  tech3Description: string;
  tech3Icon: string;
  tech4Name: string;
  tech4Description: string;
  tech4Icon: string;
  tech5Name: string;
  tech5Description: string;
  tech5Icon: string;
  tech6Name: string;
  tech6Description: string;
  tech6Icon: string;
  testimonialQuote: string;
  testimonialAuthorName: string;
  testimonialAuthorTitle: string;
  testimonialAuthorCompany: string;
  testimonialAuthorInitials: string;
  resultsTitle: string;
  resultsContent: string;
  resultStat1Value: string;
  resultStat1Label: string;
  resultStat2Value: string;
  resultStat2Label: string;
  resultStat3Value: string;
  resultStat3Label: string;
};

export type CaseStudyPageModel = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  bannerImage: string;
  contentImage: string;
  heroStats: { value: string; label: string }[];
  sidebar: { label: string; href: string }[];
  background: { title: string; content: string };
  challenge: {
    title: string;
    content: string;
    stats: { value: string; label: string }[];
    problems: { title: string; content: string }[];
  };
  solution: {
    title: string;
    content: string;
    phases: { number: string; title: string; duration: string; content: string; tags: string[] }[];
  };
  techStack: {
    title: string;
    content: string;
    technologies: { name: string; description: string; icon: string }[];
  };
  testimonial: {
    quote: string;
    author: { name: string; title: string; company: string; initials: string };
  };
  results: {
    title: string;
    content: string;
    stats: { value: string; label: string }[];
  };
  cta: { title: string; subtitle: string };
};

export const CASE_STUDY_SIDEBAR = [
  { label: "Background", href: "#background" },
  { label: "The Challenge", href: "#challenge" },
  { label: "Our Solution", href: "#solution" },
  { label: "Technology Stack", href: "#tech-stack" },
  { label: "Results", href: "#results" },
  { label: "Key Takeaways", href: "#takeaways" },
];

function techIconLabel(icon: string, name: string): string {
  const t = (icon || "").trim();
  if (t.length <= 2) return t.toUpperCase() || name.charAt(0).toUpperCase();
  return name.charAt(0).toUpperCase();
}

export function mapCaseStudyApiToPageModel(data: CaseStudyApiRecord): CaseStudyPageModel {
  const featuredResolved = resolveMediaUrl(data.featuredImage);
  const bannerRaw = (data.bannerImage ?? "").trim();
  const bannerImage = bannerRaw ? resolveMediaUrl(bannerRaw) : featuredResolved;
  const contentRaw = (data.contentImage ?? "").trim();
  const contentImage = contentRaw ? resolveMediaUrl(contentRaw) : "";

  const phases: CaseStudyPageModel["solution"]["phases"] = [
    { number: "1", title: data.phase1Title, duration: data.phase1Duration, content: data.phase1Content, tags: data.phase1Tags ?? [] },
    { number: "2", title: data.phase2Title, duration: data.phase2Duration, content: data.phase2Content, tags: data.phase2Tags ?? [] },
    { number: "3", title: data.phase3Title, duration: data.phase3Duration, content: data.phase3Content, tags: data.phase3Tags ?? [] },
  ];
  if (data.phase4Title) {
    phases.push({
      number: "4",
      title: data.phase4Title,
      duration: data.phase4Duration ?? "",
      content: data.phase4Content ?? "",
      tags: data.phase4Tags ?? [],
    });
  }

  const technologies = [
    { name: data.tech1Name, description: data.tech1Description, icon: techIconLabel(data.tech1Icon, data.tech1Name) },
    { name: data.tech2Name, description: data.tech2Description, icon: techIconLabel(data.tech2Icon, data.tech2Name) },
    { name: data.tech3Name, description: data.tech3Description, icon: techIconLabel(data.tech3Icon, data.tech3Name) },
    { name: data.tech4Name, description: data.tech4Description, icon: techIconLabel(data.tech4Icon, data.tech4Name) },
    { name: data.tech5Name, description: data.tech5Description, icon: techIconLabel(data.tech5Icon, data.tech5Name) },
    { name: data.tech6Name, description: data.tech6Description, icon: techIconLabel(data.tech6Icon, data.tech6Name) },
  ];

  return {
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle,
    category: data.category,
    bannerImage,
    contentImage,
    heroStats: [
      { value: data.heroStat1Value, label: data.heroStat1Label },
      { value: data.heroStat2Value, label: data.heroStat2Label },
      { value: data.heroStat3Value, label: data.heroStat3Label },
    ],
    sidebar: CASE_STUDY_SIDEBAR,
    background: { title: data.backgroundTitle, content: data.backgroundContent },
    challenge: {
      title: data.challengeTitle,
      content: data.challengeContent,
      stats: [
        { value: data.challengeStat1Value, label: data.challengeStat1Label },
        { value: data.challengeStat2Value, label: data.challengeStat2Label },
        { value: data.challengeStat3Value, label: data.challengeStat3Label },
      ],
      problems: [
        { title: data.problem1Title, content: data.problem1Content },
        { title: data.problem2Title, content: data.problem2Content },
        { title: data.problem3Title, content: data.problem3Content },
        { title: data.problem4Title, content: data.problem4Content },
      ],
    },
    solution: {
      title: data.solutionTitle,
      content: data.solutionContent,
      phases,
    },
    techStack: {
      title: data.techStackTitle,
      content: data.techStackIntro,
      technologies,
    },
    testimonial: {
      quote: data.testimonialQuote,
      author: {
        name: data.testimonialAuthorName,
        title: data.testimonialAuthorTitle,
        company: data.testimonialAuthorCompany,
        initials: data.testimonialAuthorInitials,
      },
    },
    results: {
      title: data.resultsTitle,
      content: data.resultsContent,
      stats: [
        { value: data.resultStat1Value, label: data.resultStat1Label },
        { value: data.resultStat2Value, label: data.resultStat2Label },
        { value: data.resultStat3Value, label: data.resultStat3Label },
      ],
    },
    cta: {
      title: `Ready to achieve similar outcomes with ${data.clientName}?`,
      subtitle:
        "Tell us about your challenge and we'll respond with a tailored approach within 4 business hours.",
    },
  };
}

export type CaseStudyListCard = {
  slug: string;
  category: string;
  title: string;
  description: string;
  image: string;
  stat1: { value: string; label: string };
  stat2: { value: string; label: string };
  date: string;
  featured: boolean;
  sidebar: { label: string; href: string }[];
};

export function formatCaseStudyDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function apiRowToListCard(row: {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  featuredImage: string;
  featured?: boolean;
  heroStat1Value: string;
  heroStat1Label: string;
  heroStat2Value: string;
  heroStat2Label: string;
  createdAt: string;
}): CaseStudyListCard {
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    description: row.subtitle,
    image: resolveMediaUrl(row.featuredImage),
    stat1: { value: row.heroStat1Value, label: row.heroStat1Label },
    stat2: { value: row.heroStat2Value, label: row.heroStat2Label },
    date: formatCaseStudyDate(row.createdAt),
    featured: Boolean(row.featured),
    sidebar: CASE_STUDY_SIDEBAR,
  };
}
