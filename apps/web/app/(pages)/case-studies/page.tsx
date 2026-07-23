import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Workflow, Share2, FileStack, Braces, Handshake, type LucideIcon } from "lucide-react";
import { ArticleBottomCta } from "@/components/case-study/ArticleBottomCta";
import { CaseStudiesPracticeSection } from "@/components/case-study/CaseStudiesPracticeSection";
import { ClientStoriesSection } from "@/components/ClientStoriesSection";
import { SectionPill } from "@/components/ui/SectionPill";
import { getPublishedCaseStudies, getCaseStudyCategories, getTestimonials } from "@/lib/api/public";
import { apiRowToListCard } from "@/lib/case-study-mapper";
import type { ClientStoryItem } from "@/components/ClientStoriesSection";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { resolveCaseStudiesPage } from "@/lib/site-content/resolve-pages";

const CASE_STUDY_TILE_ICONS: Record<string, LucideIcon> = {
  Zap,
  Workflow,
  Share2,
  FileStack,
  Braces,
};

export default async function CaseStudiesPage() {
  const [rows, testimonialRows, rawCs, taxonomyCategories] = await Promise.all([
    getPublishedCaseStudies(),
    getTestimonials(),
    fetchSiteContentPayload<unknown>("case_studies_page"),
    getCaseStudyCategories(),
  ]);
  const cs = resolveCaseStudiesPage(rawCs);

  const caseStudies = rows.map(apiRowToListCard);
  const categoryOrder = [
    ...taxonomyCategories
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map((c) => c.name),
    ...cs.practiceSection.categories.filter(
      (name) => name !== "All" && !taxonomyCategories.some((c) => c.name === name),
    ),
  ];

  const clientStories: ClientStoryItem[] = testimonialRows.map((t) => ({
    quote: t.quote,
    authorName: t.authorName,
    authorTitle: t.authorTitle,
    authorCompany: t.authorCompany,
    authorInitials: t.authorInitials,
    authorImageUrl: t.authorImageUrl || undefined,
  }));

  return (
    <>
      {/* Hero */}
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-white">{cs.hero.title}</h1>
            <p className="mt-1 max-w-[976px] text-[18px] leading-7 text-[#e5e5e5]">{cs.hero.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Stats strip — node 205:2838 */}
      <section className="relative z-10 -mt-[85px] bg-transparent">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px] rounded-[30px] bg-white shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            <div className="flex flex-wrap items-center justify-around gap-y-4 px-8 py-6 sm:h-[170px] sm:flex-nowrap sm:py-0">
              <div className="px-2">
                <p className="text-[16px] font-bold leading-6 text-[#111111]">{cs.statsStrip.blurb}</p>
              </div>

              {cs.statsStrip.stats.map((stat, index) => (
                <Fragment key={`${stat.label}-${index}`}>
                  <span className="hidden h-[78px] w-px bg-[#e5e5e5] sm:block" aria-hidden />
                  <div className="text-center">
                    <p className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#111111]">{stat.value}</p>
                    <p className="text-[12px] font-medium leading-4 text-[#666666]">{stat.label}</p>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies by Practice — node 205:2573 */}
      <section className="py-[100px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <SectionPill label={cs.practiceSection.pill} />
            <h2 className="mt-2 text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">
              {cs.practiceSection.titleLine1}
              {cs.practiceSection.titleLine2 ? (
                <>
                  <br />
                  {cs.practiceSection.titleLine2}
                </>
              ) : null}
            </h2>
            <p className="mt-1 max-w-[898px] text-[18px] leading-7 text-[#666666]">{cs.practiceSection.subtitle}</p>

            <CaseStudiesPracticeSection
              caseStudies={caseStudies}
              categoryOrder={categoryOrder}
              emptyState={cs.emptyState}
            />
          </div>
        </div>
      </section>

      {/* Deep Expertise Section — node 205:2669 */}
      <section className="bg-[#e5e5e5] py-[100px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1139px]">
            <SectionPill label={cs.expertiseSection.pill} />

            <h2 className="mt-2 max-w-[898px] text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">
              {cs.expertiseSection.titleLine1}
              {cs.expertiseSection.titleLine2 ? (
                <>
                  <br />
                  {cs.expertiseSection.titleLine2}
                </>
              ) : null}
            </h2>
            <p className="mt-1 max-w-[898px] text-[18px] leading-7 text-[#666666]">{cs.expertiseSection.subtitle}</p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cs.expertiseSection.tiles.map((item) => {
                const Icon = CASE_STUDY_TILE_ICONS[item.iconKey] ?? Zap;
                return (
                  <div key={item.title} className="rounded-[15px] border border-[#e5e5e5] bg-[#f7f7f7] px-[22px] pt-8 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-white">
                      <Icon className="h-6 w-6 text-[#111111]" strokeWidth={2} aria-hidden />
                    </div>

                    <h3 className="mt-4 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">{item.title}</h3>
                    <p className="mt-1 text-[16px] leading-6 text-[#666666]">{item.description}</p>

                    <button type="button" className="mt-4 inline-flex h-[29px] items-center gap-[10px] rounded-[18px] text-[14px] font-semibold leading-5 text-[#666666]">
                      {item.exploreLabel}
                      <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                    </button>
                  </div>
                );
              })}

              <div className="rounded-[15px] border border-[#e5e5e5] bg-[#111111] px-[22px] pt-8 pb-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="flex h-[72px] w-[72px] items-center justify-center">
                    <Handshake className="h-10 w-10 text-white" strokeWidth={2} aria-hidden />
                  </div>
                  <h3 className="max-w-[235px] text-[28px] font-bold leading-9 tracking-[-0.07px]">{cs.expertiseSection.ctaTile.title}</h3>
                </div>

                <p className="mt-3 text-[16px] leading-6 text-[#e5e5e5]">{cs.expertiseSection.ctaTile.body}</p>

                <Link
                  href={cs.expertiseSection.ctaTile.buttonHref}
                  className="mt-3 inline-flex h-[43px] w-[208px] items-center justify-center gap-2 rounded-[18px] bg-white text-[14px] font-semibold leading-5 text-[#111111]"
                >
                  {cs.expertiseSection.ctaTile.buttonLabel}
                  <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClientStoriesSection items={clientStories} />

      <ArticleBottomCta
        title={cs.bottomCta.title}
        description={cs.bottomCta.description}
        primaryHref={cs.bottomCta.primaryHref}
        primaryLabel={cs.bottomCta.primaryLabel}
        secondaryHref={cs.bottomCta.secondaryHref}
        secondaryLabel={cs.bottomCta.secondaryLabel}
      />
    </>
  );
}
