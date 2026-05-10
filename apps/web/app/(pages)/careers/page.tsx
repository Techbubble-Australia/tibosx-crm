import Link from "next/link";
import { Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, Laptop, TrendingUp, Users, Lightbulb, Globe, Clock, Award, Mail } from "lucide-react";
import { getPublishedJobs } from "@/lib/api/public";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { resolveCareersPage } from "@/lib/site-content/resolve-pages";
import { CareersPositionsSection } from "@/components/careers/CareersPositionsSection";
import { SectionPill } from "@/components/ui/SectionPill";

const CAREERS_ICONS: Record<string, LucideIcon> = {
  Laptop,
  TrendingUp,
  Users,
  Lightbulb,
  Globe,
  Clock,
  Award,
};

export default async function CareersPage() {
  const rawCareers = await fetchSiteContentPayload<unknown>("careers_page");
  const c = resolveCareersPage(rawCareers ?? {});
  const jobs = await getPublishedJobs();

  return (
    <>
      {/* Hero — node 205:3319 */}
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-white">{c.hero.title}</h1>
            <p className="mt-1 max-w-[968px] text-[18px] leading-7 text-[#e5e5e5]">{c.hero.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Stats strip — node 205:3345 */}
      <section className="relative z-10 -mt-[85px] bg-transparent pb-[120px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px] rounded-[30px] bg-white shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            <div className="flex flex-wrap items-center justify-around gap-y-4 px-8 py-6 sm:h-[170px] sm:flex-nowrap sm:py-0">
            {c.statsStrip.map((stat, idx) => {
              const Icon =
                stat.kind === "icon" && typeof stat.icon === "string"
                  ? (CAREERS_ICONS[stat.icon] ?? Laptop)
                  : null;
              return (
                <Fragment key={`${stat.kind}-${stat.label}-${idx}`}>
                  <div className="flex items-center py-2">
                    <div
                      className={
                        stat.kind === "icon"
                          ? "flex flex-col items-center justify-center text-center"
                          : "text-center"
                      }
                    >
                      {stat.kind === "number" ? (
                        <>
                          <p className="text-4xl font-bold leading-[64px] tracking-[-0.28px] text-[#111111] lg:text-[56px]">{stat.value}</p>
                          <p className="text-[12px] font-medium leading-4 text-[#666666]">{stat.label}</p>
                        </>
                      ) : (
                        Icon && (
                          <>
                            <Icon className="h-[56px] w-[56px] text-[#111111] stroke-[1.5]" aria-hidden />
                            <p className="mt-1 text-[12px] font-medium leading-4 text-[#666666]">{stat.label}</p>
                          </>
                        )
                      )}
                    </div>
                  </div>
                  {idx < c.statsStrip.length - 1 ? <span className="hidden h-[78px] w-px bg-[#e5e5e5] sm:block" aria-hidden /> : null}
                </Fragment>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      {/* Why Work Here — node 205:2977 */}
      <section className="bg-white pb-10">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <SectionPill label={c.cultureSection.eyebrow} />
            <h2 className="mt-2 text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">{c.cultureSection.title}</h2>
            <p className="mt-1 max-w-[898px] text-[18px] leading-7 text-[#666666]">{c.cultureSection.subtitle}</p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {c.cultureCards.map((item, index) => {
                const Icon =
                  typeof item.icon === "string" ? (CAREERS_ICONS[item.icon] ?? Users) : Users;
                return (
                  <div key={`${item.title}-${index}`} className="rounded-[15px] border border-[#e5e5e5] bg-[#f7f7f7] px-[22px] pb-6 pt-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#e5e5e5] bg-white">
                      <Icon className="h-6 w-6 text-[#111111] stroke-[1.5]" aria-hidden />
                    </div>
                    <div className="mt-4">
                      <h3 className="text-[28px] font-bold leading-[36px] tracking-[-0.07px] text-[#06091a]">{item.title}</h3>
                      <p className="mt-1 text-[16px] leading-6 text-[#666666]">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions — API-driven list + filters */}
      <section className="bg-[#e5e5e5] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <CareersPositionsSection jobs={jobs} />
          </div>
        </div>
      </section>

      {/* Application Form — node 205:3074 */}
      <section
        id="apply"
        className="relative overflow-hidden py-[120px] text-white scroll-mt-24"
        style={{ background: "linear-gradient(160deg, #000000 0%, #202020 55%, #101112 100%)" }}
      >
        <div className="pointer-events-none absolute -left-[120px] bottom-[-120px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(76,76,76,0.12)_0%,rgba(56,56,56,0)_65%)]" />
        <div className="pointer-events-none absolute -right-[120px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(127,127,127,0.1)_0%,rgba(142,142,142,0)_65%)]" />

        <div className="tb-container relative">
          <div className="mx-auto grid max-w-[1136px] grid-cols-1 justify-between gap-10 lg:grid-cols-[536px_1fr]">
            <div>
              <SectionPill label="Apply Now" />

              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.28px] text-white md:text-5xl lg:text-[56px] lg:leading-[64px]">Take the First Step</h2>
              <p className="mt-1 text-[18px] font-normal leading-7 text-[#e5e5e5]">
                Fill out the form and share your details, CV, and portfolio. We can&apos;t wait to learn more about you!
              </p>

              <div className="mt-8 space-y-[10px]">
                {c.benefits.map((item) => (
                  <div key={item} className="flex items-center gap-[10px]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-[10px] bg-white">
                      <Check className="h-[10px] w-[10px] text-[#111111]" strokeWidth={3} />
                    </span>
                    <span className="text-[14px] font-normal leading-5 tracking-[0.035px] text-white">{item}</span>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-[16px] font-normal leading-6 text-[#e5e5e5]">
                Need help? Contact us at <a href="mailto:recruitment@techbubble.com.au" className="font-bold text-white">recruitment@techbubble.com.au</a>
              </p>
            </div>

            <div className="rounded-[28px] border border-white/[0.12] bg-white/[0.06] px-[37px] py-8">
              <h3 className="text-[28px] font-bold leading-9 tracking-[-0.07px] text-white">Submit Your Application</h3>
              <p className="mt-1 text-[14px] font-normal leading-5 tracking-[0.035px] text-[#e5e5e5]">
                Our team will review and reach out within 48 hours.
              </p>

              <form className="mt-8 space-y-[14px]">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                </div>

                <input
                  type="email"
                  placeholder="Email"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Position interested in *"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />

                <div className="flex h-[100px] items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.08] text-center">
                  <div>
                    <p className="text-[14px] font-normal leading-5 tracking-[0.035px] text-white/35">Upload your resume</p>
                    <p className="text-[10px] font-medium leading-[14px] tracking-[0.1px] text-white/35">PDF, DOC, DOCX (max 5MB)</p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Tell us about yourself..."
                  className="h-12 w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[21px] text-[14px] text-white placeholder:text-white/60 focus:outline-none"
                />

                <button
                  type="submit"
                  className="mt-[18px] inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[16px] font-semibold leading-6 text-[#111111]"
                >
                  Submit Application
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — node 205:3151 */}
      <section className="bg-[#f7f7f7] py-[120px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[751px_353px] gap-8">
            <div>
              <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
                Ready to build your dream team in under 24 hours?
              </h2>
              <p className="mt-2 max-w-[751px] text-[18px] leading-7 text-[#666666]">
                Join 50+ enterprises who trust TechBubble to power their most critical technology initiatives.
              </p>
            </div>

            <div>
              <div className="ml-8 flex w-[289px] items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-[51px] w-[118px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white"
                >
                  <Mail className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  Email Us
                </Link>
                <a
                  href="tel:+611300934031"
                  className="inline-flex h-[51px] w-[159px] items-center justify-center rounded-[18px] border border-[#e5e5e5] bg-[#e5e5e5] text-[14px] font-semibold text-[#111111]"
                >
                  (+61) 1300 934 031
                </a>
              </div>

              <div className="ml-8 mt-8 space-y-4">
                {[
                  "No commitment required",
                  "Response within 2 hours",
                  "Free consultation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[9px] border border-[#e5e5e5] bg-[#fafafa]">
                      <Check className="h-[10px] w-[10px] text-[#111111]" strokeWidth={2.5} aria-hidden />
                    </span>
                    <span className="text-[14px] font-semibold leading-5 text-[#666666]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
