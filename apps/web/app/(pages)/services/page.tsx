import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  FileText,
  Globe2,
  LineChart,
  MessageCircle,
  Rocket,
  Scaling,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { TechnologyExpertiseSection } from "@/components/TechnologyExpertiseSection";
import { SectionPill } from "@/components/ui/SectionPill";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { resolveServicesPage } from "@/lib/site-content/resolve-pages";

const TRUST_ICONS: Record<string, LucideIcon> = {
  Scaling,
  Transparency: Eye,
  Quality: ShieldCheck,
  Global: Globe2,
};

const PROCESS_ICONS: Record<string, LucideIcon> = {
  MessageCircle,
  LineChart,
  FileText,
  Rocket,
};

export default async function ServicesPage() {
  const raw = await fetchSiteContentPayload<unknown>("services_page");
  const d = resolveServicesPage(raw);

  return (
    <>
      {/* Hero */}
      <section className="bg-[#111111] pb-16 pt-[109px] text-white md:pb-24">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px] text-center">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">{d.hero.title}</h1>
            <p className="mx-auto mt-4 max-w-[920px] text-[18px] leading-7 text-[#e5e5e5]">{d.hero.subtitle}</p>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.highlights.map((item) => {
                const Icon = TRUST_ICONS[item.icon] ?? Scaling;
                return (
                  <div
                    key={item.title}
                    className="flex flex-col items-center rounded-[16px] border border-[#2a2a2a] bg-white px-6 py-8 text-center text-[#111111]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fafafa]">
                      <Icon className="h-6 w-6 text-[#111111]" strokeWidth={1.5} aria-hidden />
                    </div>
                    <p className="mt-4 text-[18px] font-bold leading-6">{item.title}</p>
                    <p className="mt-2 text-[14px] leading-5 text-[#666666]">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 01 Project Services */}
      <section className="bg-white py-16 md:py-24">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#666666]">{d.projectServices.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.02em] text-[#111111] md:text-[40px] md:leading-[48px]">
                {d.projectServices.title}
              </h2>
              <p className="mt-4 text-[16px] leading-7 text-[#666666] md:text-[18px]">{d.projectServices.body}</p>
              <ul className="mt-8 space-y-4">
                {d.projectServices.bullets.map((line) => (
                  <li key={line} className="flex gap-3 text-[16px] leading-6 text-[#111111]">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#086eff]" strokeWidth={2.5} aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-2">
                {d.projectServices.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-2 text-[12px] font-semibold text-[#666666]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/contact"
                className="mt-10 inline-flex h-[52px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] px-8 text-[14px] font-semibold text-white"
              >
                Get Started
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </div>
            <div className="flex flex-col overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-[#fafafa] shadow-sm">
              <div className="bg-[#111111] px-8 py-5">
                <h3 className="text-[20px] font-bold text-white">{d.projectServices.missionCard.title}</h3>
              </div>
              <div className="flex flex-1 flex-col px-8 py-8">
                <p className="text-[16px] leading-7 text-[#666666]">{d.projectServices.missionCard.body}</p>
                <div className="mt-10 grid grid-cols-2 gap-4">
                  {d.projectServices.missionCard.metrics.map((m) => (
                    <div key={m.label} className="rounded-[14px] border border-[#e5e5e5] bg-white px-5 py-6 text-center">
                      <p className="text-[28px] font-bold leading-8 text-[#111111]">{m.value}</p>
                      <p className="mt-1 text-[12px] font-medium uppercase tracking-wide text-[#666666]">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 Product Development */}
      <section className="bg-[#f2f2f2] py-16 md:py-24">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#666666]">{d.productDevelopment.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.02em] text-[#111111] md:text-[40px] md:leading-[48px]">
                  {d.productDevelopment.title}
                </h2>
              </div>
              <p className="text-[16px] leading-7 text-[#666666] md:text-[18px] lg:pt-8">{d.productDevelopment.intro}</p>
            </div>
            <ul className="mt-10 space-y-4 lg:mt-12">
              {d.productDevelopment.bullets.map((line) => (
                <li key={line} className="flex gap-3 text-[16px] leading-6 text-[#111111]">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#086eff]" strokeWidth={2.5} aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-[20px] bg-[#111111] px-6 py-8 md:px-10 md:py-10">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
                {d.productDevelopment.metricsBar.map((m) => (
                  <div key={m.label} className="text-center md:text-left">
                    <p className="text-[22px] font-bold leading-7 text-white md:text-[26px]">{m.value}</p>
                    <p className="mt-1 text-[12px] font-medium leading-4 text-[#c4c4c4]">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {d.productDevelopment.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-[12px] font-semibold text-[#666666]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/contact"
                className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 self-start rounded-[18px] bg-[#111111] px-8 text-[14px] font-semibold text-white sm:self-auto"
              >
                Get Started
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 03 Staffing Services */}
      <section className="bg-white py-16 md:py-24">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px] rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] p-6 md:p-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#666666]">{d.staffingServices.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.02em] text-[#111111] md:text-[40px] md:leading-[48px]">
                  {d.staffingServices.title}
                </h2>
                <p className="mt-4 text-[16px] leading-7 text-[#666666] md:text-[18px]">{d.staffingServices.body}</p>
                <ul className="mt-8 space-y-4">
                  {d.staffingServices.bullets.map((line) => (
                    <li key={line} className="flex gap-3 text-[16px] leading-6 text-[#111111]">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#086eff]" strokeWidth={2.5} aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-2">
                  {d.staffingServices.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-[12px] font-semibold text-[#666666]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col overflow-hidden rounded-[20px] bg-[#111111]">
                <div className="px-8 py-6">
                  <h3 className="text-[18px] font-bold text-white">{d.staffingServices.metricsTitle}</h3>
                </div>
                <div className="flex flex-1 flex-col justify-between px-8 pb-8 pt-2">
                  <div className="space-y-8">
                    {d.staffingServices.metrics.map((m) => (
                      <div key={m.label}>
                        <p className="text-[32px] font-bold leading-9 text-white md:text-[36px]">{m.value}</p>
                        <p className="mt-1 text-[14px] font-medium text-[#b3b3b3]">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/contact"
                    className="mt-10 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[14px] font-semibold text-[#111111]"
                  >
                    Get Started
                    <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-[#fafafa] py-16 md:py-24">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <div className="mb-12 flex flex-col items-center text-center">
              <SectionPill label={d.processSection.eyebrow} className="mb-4" />
              <h2 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">
                {d.processSection.title}
              </h2>
              <p className="mt-3 max-w-[720px] text-[16px] leading-7 text-[#666666] md:text-[18px]">{d.processSection.subtitle}</p>
            </div>
            <div className="relative grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              <div className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden h-px bg-[#e5e5e5] lg:block" aria-hidden />
              {d.processSteps.map((step) => {
                const Icon = PROCESS_ICONS[step.icon] ?? MessageCircle;
                return (
                  <div key={step.title} className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-[#e5e5e5] bg-white shadow-sm">
                      <Icon className="h-6 w-6 text-[#111111]" strokeWidth={1.5} aria-hidden />
                    </div>
                    <h3 className="mt-6 text-[16px] font-bold leading-6 text-[#111111]">{step.title}</h3>
                    <p className="mt-2 max-w-[260px] text-[14px] leading-5 text-[#666666]">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <TechnologyExpertiseSection />

      {/* CTA — reference: left copy + buttons, right checklist only */}
      <section className="bg-[#f2f2f2] py-16 md:py-[60px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">
                {d.cta.title}
              </h2>
              <p className="mt-4 max-w-[640px] text-[16px] leading-7 text-[#666666] md:text-[18px]">{d.cta.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={d.cta.primaryHref}
                  className="inline-flex h-[52px] min-w-[160px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] px-8 text-[14px] font-semibold text-white"
                >
                  {d.cta.primaryLabel}
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
                <Link
                  href={d.cta.secondaryHref}
                  className="inline-flex h-[52px] min-w-[160px] items-center justify-center rounded-[18px] border border-[#d0d0d0] bg-white px-8 text-[14px] font-semibold text-[#111111]"
                >
                  {d.cta.secondaryLabel}
                </Link>
              </div>
            </div>
            <div className="rounded-[20px] border border-[#e8e8e8] bg-white p-8">
              <ul className="space-y-5">
                {d.cta.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fafafa]">
                      <Check className="h-3 w-3 text-[#111111]" strokeWidth={3} aria-hidden />
                    </span>
                    <span className="text-[15px] font-semibold leading-6 text-[#666666]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
