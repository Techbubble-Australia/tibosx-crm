import { Fragment } from "react";
import Link from "next/link";
import { UploadableImage } from "@/components/media/UploadableImage";
import { ArrowRight, Zap, Workflow, Share2, FileStack, Braces, Handshake, type LucideIcon } from "lucide-react";
import { ArticleBottomCta } from "@/components/case-study/ArticleBottomCta";
import { ClientStoriesSection } from "@/components/ClientStoriesSection";
import { SectionPill } from "@/components/ui/SectionPill";
import { getPublishedCaseStudies, getTestimonials } from "@/lib/api/public";
import { apiRowToListCard, type CaseStudyListCard } from "@/lib/case-study-mapper";
import { displayCategoryPill } from "@/lib/display-category";
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
  const [rows, testimonialRows, rawCs] = await Promise.all([
    getPublishedCaseStudies(50),
    getTestimonials(),
    fetchSiteContentPayload<unknown>("case_studies_page"),
  ]);
  const cs = resolveCaseStudiesPage(rawCs);

  const caseStudies: CaseStudyListCard[] = rows.map(apiRowToListCard);

  const featuredStudy = caseStudies.find((s) => s.featured) ?? caseStudies[0];
  const rest = featuredStudy ? caseStudies.filter((s) => s.slug !== featuredStudy.slug) : [];
  const topRightStudy = rest[0];
  const lowerStudies = rest.slice(1, 4);

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

            <div className="mt-8 flex flex-wrap gap-2">
              {cs.practiceSection.categories.map((cat, index) => (
                <button
                  key={cat}
                  className={`inline-flex h-10 items-center rounded-[35px] border border-[#e5e5e5] px-[23px] text-[16px] font-semibold leading-6 transition-colors ${
                    index === 0 ? "bg-[#111111] text-white" : "bg-white text-[#666666] hover:bg-[#f7f7f7]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {caseStudies.length === 0 ? (
              <div className="mt-12 rounded-[24px] border border-dashed border-[#e5e5e5] bg-[#fafafa] px-8 py-16 text-center">
                <p className="text-[18px] font-semibold text-[#111111]">{cs.emptyState.title}</p>
                <p className="mt-2 text-[16px] leading-6 text-[#666666]">{cs.emptyState.body}</p>
                <Link
                  href={cs.emptyState.ctaHref}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#111111] px-6 text-[14px] font-semibold text-white"
                >
                  {cs.emptyState.ctaLabel}
                </Link>
              </div>
            ) : featuredStudy ? (
              <div className="mt-8">
                <div
                  className={`grid gap-4 ${topRightStudy ? "grid-cols-1 lg:grid-cols-[746px_1fr]" : "grid-cols-1 max-w-[746px]"}`}
                >
                  <Link
                    href={`/case-studies/${featuredStudy.slug}`}
                      className="group flex min-h-[400px] overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-white lg:h-[547px]"
                  >
                      <div className="flex h-full flex-1 flex-col px-[33px] pb-6 pt-[26px]">
                        <div className="flex items-center justify-between">
                        <div className="inline-flex h-7 items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666]">
                          {displayCategoryPill(featuredStudy.category)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                          <span className="text-[12px] font-medium leading-4 text-[#666666]">{featuredStudy.date}</span>
                        </div>
                      </div>

                        <div className="relative mt-[14px] h-[150px] overflow-hidden rounded-[8px]">
                        <UploadableImage
                          src={featuredStudy.image}
                          alt=""
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 1200px) 100vw, 451px"
                        />
                      </div>

                      <h3 className="mt-[18px] line-clamp-3 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">
                        {featuredStudy.title}
                      </h3>
                      <p className="mt-[6px] line-clamp-5 text-[16px] leading-6 text-[#666666]">
                        {featuredStudy.description}
                      </p>

                      <div className="mt-auto flex items-end justify-between border-t border-[#e5e5e5] pt-[21px]">
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{featuredStudy.stat1.value}</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{featuredStudy.stat1.label}</p>
                        </div>
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{featuredStudy.stat2.value}</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{featuredStudy.stat2.label}</p>
                        </div>
                        <span className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white">
                          Read
                          <ArrowRight className="h-[18px] w-[18px]" />
                        </span>
                      </div>
                    </div>

                      <div className="hidden w-[228px] shrink-0 bg-[#111111] px-[25px] pt-[49px] text-white lg:block">
                      <p className="text-[12px] font-bold leading-4">ON THIS CASE STUDY</p>
                      <div className="mt-[15px]">
                        {featuredStudy.sidebar?.map((item, idx) => (
                          <div key={item.label} className={`flex h-[42px] items-center border-[#e5e5e5] ${idx < 5 ? "border-b" : ""}`}>
                            <span className={`mr-[10px] h-[14px] w-[3px] rounded-[2px] ${idx === featuredStudy.sidebar.length - 1 ? "bg-[#086eff]" : "bg-white"}`} />
                            <span className="text-[12px] font-medium leading-4 text-white">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>

                  {topRightStudy ? (
                    <Link
                      href={`/case-studies/${topRightStudy.slug}`}
                        className="group flex flex-col rounded-[24px] border border-[#e5e5e5] bg-white px-[30px] pb-[30px] pt-9 lg:h-[547px]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex h-[28px] items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666]">
                          {displayCategoryPill(topRightStudy.category)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                          <span className="text-[12px] font-medium leading-4 text-[#666666]">{topRightStudy.date}</span>
                        </div>
                      </div>

                      <h3 className="mt-[13px] line-clamp-3 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">
                        {topRightStudy.title}
                      </h3>
                      <p className="mt-4 line-clamp-6 text-[16px] leading-6 text-[#666666]">
                        {topRightStudy.description}
                      </p>

                      <div className="mt-auto flex items-end justify-between border-t border-[#e5e5e5] pt-[21px]">
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{topRightStudy.stat1.value}</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{topRightStudy.stat1.label}</p>
                        </div>
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{topRightStudy.stat2.value}</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{topRightStudy.stat2.label}</p>
                        </div>
                        <span className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white">
                          Read
                          <ArrowRight className="h-[18px] w-[18px]" />
                        </span>
                      </div>
                    </Link>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {lowerStudies.map((study) => (
                    <Link
                      key={study.slug}
                      href={`/case-studies/${study.slug}`}
                      className="group flex h-[494px] flex-col rounded-[24px] border border-[#e2e7f4] bg-white px-9 pb-6 pt-9"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex h-[28px] items-center rounded-[2px] bg-[#f7f7f7] px-3 text-[12px] font-bold leading-4 text-[#666666]">
                          {displayCategoryPill(study.category)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                          <span className="text-[12px] font-medium leading-4 text-[#666666]">{study.date}</span>
                        </div>
                      </div>

                      <h3 className="mt-[12px] line-clamp-3 text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">
                        {study.title}
                      </h3>
                      <p className="mt-[12px] line-clamp-6 text-[16px] leading-6 text-[#666666]">
                        {study.description}
                      </p>

                      <span className="mt-[21px] block h-px w-full bg-[#e5e5e5]" aria-hidden />

                      <div className="mt-auto flex items-end justify-between pt-[21px]">
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{study.stat1.value}</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{study.stat1.label}</p>
                        </div>
                        <div>
                          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{study.stat2.value}</p>
                          <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-[#666666]">{study.stat2.label}</p>
                        </div>
                        <span className="inline-flex h-[43px] w-[95px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white">
                          Read
                          <ArrowRight className="h-[18px] w-[18px]" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
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
