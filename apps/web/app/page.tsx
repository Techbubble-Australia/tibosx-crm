import { MarketingHome } from "@/components/home/MarketingHome";
import { marketingHomePayload, type MarketingHomePayload } from "@/lib/data/marketing-home-payload";
import { deepMerge } from "@/lib/deep-merge";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { getPublishedCaseStudies, getPublishedJobs, getTestimonials } from "@/lib/api/public";
import { apiRowToListCard } from "@/lib/case-study-mapper";
import type { HomeClientStory, HomePreviewJob } from "@/components/home/MarketingHome";

export const dynamic = "force-dynamic";

function cloneMarketingHomeDefaults(): MarketingHomePayload {
  return JSON.parse(JSON.stringify(marketingHomePayload)) as MarketingHomePayload;
}

export default async function HomePage() {
  const [rawHome, testimonialRows, jobs, caseStudyRows] = await Promise.all([
    fetchSiteContentPayload<unknown>("marketing_home"),
    getTestimonials(),
    getPublishedJobs(),
    getPublishedCaseStudies(24),
  ]);

  const content: MarketingHomePayload =
    rawHome && typeof rawHome === "object" && !Array.isArray(rawHome)
      ? (deepMerge(
          cloneMarketingHomeDefaults() as unknown as Record<string, unknown>,
          rawHome,
        ) as MarketingHomePayload)
      : marketingHomePayload;

  const testimonials: HomeClientStory[] = testimonialRows.map((t) => ({
    quote: t.quote,
    authorName: t.authorName,
    authorTitle: t.authorTitle,
    authorCompany: t.authorCompany,
    authorInitials: t.authorInitials,
    authorImageUrl: t.authorImageUrl || undefined,
  }));

  const previewJobs: HomePreviewJob[] = jobs.slice(0, 4).map((j) => ({
    slug: j.slug,
    title: j.title,
    meta: `${j.referenceNumber ? `${j.referenceNumber} · ` : ""}${j.flag} ${j.location} · ${j.type} · ${j.workMode}`,
    href: `/careers/${encodeURIComponent(j.slug)}`,
  }));

  const caseStudies = caseStudyRows.map(apiRowToListCard);

  return (
    <MarketingHome
      content={content}
      testimonials={testimonials}
      previewJobs={previewJobs}
      caseStudies={caseStudies}
    />
  );
}
