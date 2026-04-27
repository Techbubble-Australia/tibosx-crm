import { MarketingHome } from "@/components/home/MarketingHome";
import { marketingHomePayload, type MarketingHomePayload } from "@/lib/data/marketing-home-payload";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { getPublishedJobs, getTestimonials } from "@/lib/api/public";
import type { HomeClientStory, HomePreviewJob } from "@/components/home/MarketingHome";

function isMarketingHomePayload(v: unknown): v is MarketingHomePayload {
  return Boolean(v && typeof v === "object" && "hero" in v && "platforms" in v);
}

export default async function HomePage() {
  const [rawHome, testimonialRows, jobs] = await Promise.all([
    fetchSiteContentPayload<unknown>("marketing_home"),
    getTestimonials(),
    getPublishedJobs(),
  ]);

  const content = isMarketingHomePayload(rawHome) ? rawHome : marketingHomePayload;

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
    meta: `${j.flag} ${j.location} · ${j.type} · ${j.workMode}`,
    href: `/careers/${encodeURIComponent(j.slug)}`,
  }));

  return (
    <MarketingHome content={content} testimonials={testimonials} previewJobs={previewJobs} />
  );
}
