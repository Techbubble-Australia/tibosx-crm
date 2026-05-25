import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClientStoriesSection } from "@/components/ClientStoriesSection";
import { getPublishedLeadershipLineup, getPublishedTeam, getTestimonials } from "@/lib/api/public";
import type { ClientStoryItem } from "@/components/ClientStoriesSection";
import { AboutAnimatedHeroStatsStrip } from "@/components/about/AboutAnimatedHeroStatsStrip";
import { AboutAnimatedMissionStatCards } from "@/components/about/AboutAnimatedMissionStatCards";
import { AboutPersonImage } from "@/components/about/AboutPersonImage";
import { RemarkableCtaSection } from "@/components/RemarkableCtaSection";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { resolveAboutPage } from "@/lib/site-content/resolve-pages";
import { SectionPill } from "@/components/ui/SectionPill";
import { AboutWorkforceApiSection, AboutWorkforceCmsFallbackSection } from "@/components/about/AboutWorkforceSection";
import { resolveLeadershipDisplay } from "@/lib/about/resolve-leadership-display";

export default async function AboutPage() {
  const rawAbout = await fetchSiteContentPayload<unknown>("about_page");
  const a = resolveAboutPage(rawAbout ?? {});
  const [testimonialRows, teamRows, leadershipLineup] = await Promise.all([
    getTestimonials(),
    getPublishedTeam(),
    getPublishedLeadershipLineup(),
  ]);
  const clientStories: ClientStoryItem[] = testimonialRows.map((t) => ({
    quote: t.quote,
    authorName: t.authorName,
    authorTitle: t.authorTitle,
    authorCompany: t.authorCompany,
    authorInitials: t.authorInitials,
    authorImageUrl: t.authorImageUrl || undefined,
  }));

  const bioFallbackByName: Record<string, string> = {};
  for (const p of a.workforce.management.people) {
    const b = (p.bio ?? "").trim();
    if (b) bioFallbackByName[p.name] = b;
  }

  const cmsWorkforce = {
    pill: a.workforce.pill,
    title: a.workforce.title,
    intro: a.workforce.intro,
    stats: a.workforce.stats,
    tabs: a.workforce.tabs,
    management: a.workforce.management,
    defaultMemberBio: a.workforce.defaultMemberBio,
  };

  const leadershipMembers = resolveLeadershipDisplay(leadershipLineup);

  return (
    <>
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">
              {a.hero.titleLine1}
              <br />
              {a.hero.titleLine2}
            </h1>
            <p className="mt-[4px] max-w-[890px] text-[18px] leading-7 text-[#e5e5e5]">{a.hero.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-[85px] bg-transparent">
        <div className="tb-container">
          <AboutAnimatedHeroStatsStrip stats={a.statsStrip} />
        </div>
      </section>

      <section className="relative bg-white py-16 md:py-[60px]">
        <div className="tb-container">
          <div className="relative mx-auto grid max-w-[1139px] grid-cols-1 gap-12 lg:grid-cols-[557px_1fr] lg:gap-[131px]">
            <div className="pt-1">
              <SectionPill label={a.mission.eyebrow} />
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">{a.mission.title}</h2>
              <p className="mt-2 max-w-[532px] whitespace-pre-line text-base leading-7 text-[#666666] md:text-[18px]">{a.mission.body}</p>
              <Link
                href={a.mission.ctaHref}
                className="mt-4 inline-flex h-[52px] w-[182px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white"
              >
                {a.mission.ctaLabel}
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </div>

            <div className="relative max-h-[500px] overflow-hidden">
              <div className="h-full space-y-4 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#c1c1c1_#f1f1f1] [&::-webkit-scrollbar]:w-[7px] [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-thumb]:bg-[#c1c1c1]">
                {a.missionCards.map((card) => (
                  <div key={card.title} className="min-h-[150px] rounded-[24px] border border-[#e5e5e5] bg-white px-4 py-[15px]">
                    <div className="flex items-start gap-5">
                      <span className="mt-9 flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-[#f7f7f7]">
                        <span className="h-3 w-3 rounded-[3px] bg-[#111111]" aria-hidden />
                      </span>
                      <div>
                        <h3 className="text-xl font-bold leading-9 tracking-[-0.07px] text-[#06091a] md:text-[28px]">{card.title}</h3>
                        <p className="mt-0.5 max-w-[392px] text-[16px] leading-6 text-[#838383]">{card.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="bg-[#fafafa] py-[60px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23d4d4d4' stroke-width='0.5'%3E%3Cpath d='M40 0 L80 20 L80 60 L40 80 L0 60 L0 20 Z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "120px",
        }}
      >
        <div className="tb-container">
          <div className="mx-auto mb-16 max-w-[1139px] text-center">
            <SectionPill label={a.leadership.pill} className="mx-auto" />
            <h2 className="mt-2 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">{a.leadership.title}</h2>
            <p className="mt-1 text-[18px] leading-7 text-[#666666]">{a.leadership.subtitle}</p>
          </div>

          <div className="mx-auto grid max-w-[1558px] grid-cols-1 gap-10 pt-12 sm:grid-cols-2 md:grid-cols-3">
            {leadershipMembers.map((leader, index) => (
              <div key={`${leader.name}-${index}`} className="rounded-[21px] bg-[#111111] px-[30px] pb-9 pt-12 text-white md:pt-0">
                <div className="relative mx-auto mb-5 h-[241px] w-[241px] overflow-hidden rounded-[14px] border border-[#f7f7f7] bg-neutral-700 md:-mt-[45px]">
                  <AboutPersonImage
                    imageUrl={leader.imageUrl}
                    imageKey={leader.imageKey}
                    alt={leader.name}
                    width={241}
                    height={241}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="text-[35px] font-semibold leading-[42px] tracking-[-0.09px]">{leader.name}</h3>
                <p className="mt-[3px] text-[14px] font-bold leading-[21px] text-white">{leader.role}</p>
                <p className="mt-3 text-[12px] leading-[17.6px] text-white">{leader.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {teamRows.length > 0 ? (
        <AboutWorkforceApiSection cms={cmsWorkforce} bioFallbackByName={bioFallbackByName} apiMembers={teamRows} />
      ) : (
        <AboutWorkforceCmsFallbackSection cms={cmsWorkforce} />
      )}

      <section className="bg-white py-[60px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1139px]">
            <SectionPill label={a.usp.pill} />
            <div className="mt-2 max-w-[898px]">
              <h2 className="text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">{a.usp.title}</h2>
              <p className="mt-1 text-[18px] leading-7 text-[#666666]">{a.usp.subtitle}</p>
            </div>
          </div>
          <div className="mx-auto mt-8 grid max-w-[1139px] grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {a.usp.columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-2xl font-semibold leading-tight tracking-[-0.1px] text-[#0e0f11] md:text-[40px] md:leading-[48px]">{col.title}</h3>
                <p className="mt-2 text-[16px] leading-6 text-[#838383]">{col.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fafafa] py-16 md:py-[60px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1139px] grid-cols-1 items-center gap-10 lg:grid-cols-[526px_1fr] lg:gap-[81px]">
            <div>
              <SectionPill label={a.values.pill} />
              <h2 className="mt-2 text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">{a.values.title}</h2>
              <p className="mt-2 text-[16px] leading-6 text-[#666666]">
                <strong>{a.values.introLeadBold}</strong>
                {a.values.introRest}
              </p>

              <div className="mt-8 space-y-2">
                {a.values.pillars.map((item) => (
                  <div key={item.title} className="rounded-[15px] border border-[#e5e5e5] bg-white px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-[4px] bg-[#666666]" aria-hidden />
                      <span className="text-[16px] font-semibold leading-6 text-[#06091a]">{item.title}</span>
                    </div>
                    <p className="mt-1 pl-5 text-[12px] font-medium leading-4 text-[#666666]">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[36px] border border-[#e2e7f4] bg-white">
              <div className="bg-[#111111] px-[30px] py-[31px]">
                <h3 className="text-xl font-medium leading-9 tracking-[-0.07px] text-white md:text-[28px]">{a.values.missionCard.title}</h3>
              </div>
              <p className="px-[27px] pb-[37px] pt-6 text-base leading-7 text-[#666666] md:text-[18px]">{a.values.missionCard.body}</p>
              <AboutAnimatedMissionStatCards metrics={a.values.missionCard.metrics} />
            </div>
          </div>
        </div>
      </section>

      <ClientStoriesSection items={clientStories} />

      <RemarkableCtaSection
        title={a.closingCta.title}
        description={a.closingCta.description}
        primaryLabel={a.closingCta.primaryLabel}
        primaryHref={a.closingCta.primaryHref}
        secondaryLabel={a.closingCta.secondaryLabel}
        secondaryHref={a.closingCta.secondaryHref}
      />
    </>
  );
}
