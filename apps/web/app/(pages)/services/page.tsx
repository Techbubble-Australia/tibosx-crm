import Link from "next/link";
import { RemarkableCtaSection } from "@/components/RemarkableCtaSection";
import { TechnologyExpertiseSection } from "@/components/TechnologyExpertiseSection";
import {
  ArrowRight,
  Phone,
  Search,
  User,
  Heart,
} from "lucide-react";


const serviceHighlights = [
  {
    title: "Rapid Deployment",
    description: "Get started in under 24 hours with our streamlined onboarding process.",
    bodyWidth: "w-[213px]",
  },
  {
    title: "Timezone Aligned",
    description: "Our teams work in your timezone for seamless real-time collaboration.",
    bodyWidth: "w-[213px]",
  },
  {
    title: "Quality Assured",
    description: "Rigorous quality standards and governance at no additional cost.",
    bodyWidth: "w-[204px]",
  },
  {
    title: "Global Reach",
    description: "Offices in USA, Australia, India, and Philippines for local support.",
    bodyWidth: "w-[196px]",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">Your Trusted Partner at Every Step of the Journey</h1>
            <p className="mt-1 max-w-[1031px] text-[18px] leading-7 text-[#e5e5e5]">
              From AI-powered staff augmentation to fixed-fee project delivery and custom product engineering — we have the expertise and talent to accelerate your enterprise.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-[85px] bg-transparent">
        <div className="tb-container">
          <div className="mx-auto flex h-[170px] max-w-[1136px] items-center rounded-[30px] bg-white px-8 shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            {serviceHighlights.map((item, idx) => (
              <div key={item.title} className="flex h-[108px] items-center">
                <div className={`${item.bodyWidth} px-2`}>
                  <h3 className="text-[18px] font-bold leading-7 text-[#111111]">{item.title}</h3>
                  <p className="mt-1 text-[14px] font-normal leading-5 tracking-[0.035px] text-[#666666]">{item.description}</p>
                </div>
                {idx < serviceHighlights.length - 1 ? <span className="mx-[30px] h-[78px] w-px bg-[#e5e5e5]" aria-hidden /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement models section — node 205:3421 */}
      <section className="bg-white pb-[120px] pt-[180px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1139px]">
            <div className="flex flex-col items-center">
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#666666]">Our Engagement Models</p>
              </div>
              <h2 className="mt-2 text-center text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
                Choose the Model That Fits Your Needs
              </h2>
              <p className="mt-1 text-center text-[18px] font-normal leading-7 text-[#666666]">
                Three proven engagement models - each designed to give you maximum value and zero surprises.
              </p>
            </div>

            <div className="relative mt-16 grid grid-cols-3 gap-[20.66px]">
              <div className="rounded-[24px] border border-[#e5e5e5] bg-[#fafafa] px-[37px] pb-[38px] pt-[38px]">
                <p className="text-[12px] font-medium leading-4 text-[#666666]">STARTER</p>
                <h3 className="mt-[5px] text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">Staff Augmentation</h3>
                <p className="mt-[6px] text-[14px] font-normal leading-5 tracking-[0.035px] text-[#838383]">
                  Skilled engineers deployed to your team, fast. T&amp;M pricing with full flexibility.
                </p>
                <div className="mt-[38px] flex items-end">
                  <span className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#06091a]">Custom</span>
                  <span className="mb-[6px] text-[14px] font-normal leading-5 tracking-[0.035px] text-[#7a82a0]"> / based on role</span>
                </div>
                <div className="mt-[27px] space-y-[10px]">
                  {[
                    "1-10 engineers placed",
                    "Onboarded in <24 hours",
                    "Timezone-aligned resources",
                    "Flexible scale up/down",
                    "Dedicated account manager",
                    "48-hour replacement guarantee",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-[10px]">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-[10px] bg-white">
                        <span className="h-[10px] w-[10px] rounded-[2px] bg-[#111111]" />
                      </span>
                      <span className="text-[14px] font-normal leading-5 tracking-[0.035px] text-[#111111]">{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/contact"
                  className="mt-[28px] inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white"
                >
                  Get a Quote
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
              </div>

              <div className="relative rounded-[24px] border border-[#666666] bg-[#111111] px-[37px] pb-[36px] pt-[39px]">
                <span className="absolute left-1/2 top-[-12.97px] -translate-x-1/2 rounded-[100px] bg-[#666666] px-4 py-[5px] text-[12px] font-bold leading-4 text-white">
                  Most Popular
                </span>
                <p className="text-[12px] font-medium leading-4 text-[#f7f7f7]">Professional</p>
                <h3 className="mt-[6px] text-[28px] font-bold leading-9 tracking-[-0.07px] text-white">Project Delivery</h3>
                <p className="mt-[6px] text-[14px] font-normal leading-5 tracking-[0.035px] text-[#e5e5e5]">
                  Fixed-fee SaaS implementations with full end-to-end delivery assurance.
                </p>
                <p className="mt-[36px] text-[41.6px] font-extrabold leading-[52px] tracking-[-1.664px] text-white" style={{ fontFamily: "Plus Jakarta Sans, Geist, sans-serif" }}>
                  Fixed Fee
                </p>
                <div className="mt-[36px] space-y-[10px]">
                  {[
                    "ServiceNow or Salesforce project",
                    "Dedicated project team assembled",
                    "Milestone-based delivery plan",
                    "99% on-budget delivery record",
                    "3-month post-launch support",
                    "Beat-any-quote guarantee",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-[10px]">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-[10px] bg-white/12">
                        <span className="h-[10px] w-[10px] rounded-[2px] bg-white" />
                      </span>
                      <span className="text-[14px] font-normal leading-[23.1px] text-[#e5e5e5]" style={{ fontFamily: "Figtree, Geist, sans-serif" }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/contact"
                  className="mt-[27px] inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[14px] font-semibold leading-5 text-[#111111]"
                >
                  Start a Project
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
              </div>

              <div className="rounded-[24px] border border-[#e5e5e5] bg-[#fafafa] px-[37px] pb-[38px] pt-[38px]">
                <p className="text-[12px] font-medium leading-4 text-[#666666]">ENTERPRISE</p>
                <h3 className="mt-[5px] text-[28px] font-bold leading-9 tracking-[-0.07px] text-[#06091a]">Product Engineering</h3>
                <p className="mt-[6px] whitespace-pre-line text-[14px] font-normal leading-5 tracking-[0.035px] text-[#838383]">
                  {"Full-scale product development with a\ndedicated AI-powered engineering team."}
                </p>
                <div className="mt-[38px] flex items-end">
                  <span className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#06091a]">Tailored</span>
                  <span className="mb-[6px] text-[14px] font-normal leading-5 tracking-[0.035px] text-[#7a82a0]"> / your scope</span>
                </div>
                <div className="mt-[27px] space-y-[10px]">
                  {[
                    "5-50+ dedicated engineers",
                    "Full-stack & mobile development",
                    "AI/ML integration included",
                    "DevSecOps pipeline setup",
                    "24/7 support & governance",
                    "Dedicated VP of Engineering",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-[10px]">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-[10px] bg-white">
                        <span className="h-[10px] w-[10px] rounded-[2px] bg-[#111111]" />
                      </span>
                      <span className="text-[14px] font-normal leading-5 tracking-[0.035px] text-[#111111]">{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/contact"
                  className="mt-[28px] inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white"
                >
                  Talk to Sales
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-step process section — node 205:4142 */}
      <section className="bg-[#fafafa] py-[120px]">
        <div className="mx-auto w-full max-w-[1139px]">
          {/* Header */}
          <div className="mb-[64px] flex flex-col items-center gap-[36px]">
            {/* Pill — right-aligned in Figma (x=-33555.5 vs container x=-34067.5, so pill is on the right side) */}
            <div className="flex w-full justify-end">
              <div className="inline-flex items-center gap-[8px] rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-[12px] py-[6px]">
                <span className="h-[6px] w-[6px] rounded-[3px] bg-[#666666]" />
                <span className="text-[12px] font-medium leading-[16px] text-[#666666]">How We Work</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-[4px]">
              <h2 className="text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111] text-center">
                From Request to Results in 4 Steps
              </h2>
              <p className="text-[18px] font-normal leading-[28px] text-[#666666] text-center">
                A streamlined approach to ensure your success from day one.
              </p>
            </div>
          </div>

          {/* 4 step cards */}
          <div className="relative grid grid-cols-4">
            {/* Connecting horizontal line through icon centers */}
            <div className="pointer-events-none absolute left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] top-[28px] h-[1px] bg-[#e5e5e5]" />

            {[
              {
                Icon: Phone,
                t: "Submit Request",
                d: "Tell us your requirement — role, platform, timeline, or project brief.",
              },
              {
                Icon: Search,
                t: "AI Matching",
                d: "Our engine shortlists 2–4 pre-vetted specialists within hours.",
              },
              {
                Icon: User,
                t: "You Choose",
                d: "Review profiles, run an optional 30-min tech interview, confirm.",
              },
              {
                Icon: Heart,
                t: "Onboarded in 24h",
                d: "Contracts signed, tools live, and your specialist is productive by tomorrow.",
              },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="relative flex flex-col items-center">
                {/* Icon box */}
                <div className="relative z-10 mb-[56px] flex h-[56px] w-[56px] items-center justify-center rounded-[28px] border border-[#e5e5e5] bg-white">
                  <Icon className="h-[22px] w-[22px] text-[#111111] stroke-[1.5]" />
                </div>
                {/* Text */}
                <h3 className="mb-[8px] text-[16px] font-bold leading-[24px] text-[#111111] text-center">{t}</h3>
                <p className="text-[14px] font-normal leading-[20px] tracking-[0.035px] text-[#666666] text-center px-[20px]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TechnologyExpertiseSection />

      <RemarkableCtaSection
        title="Ready to Transform Your Business?"
        description="Join 50+ enterprises who trust TechBubble to power their most critical technology initiatives."
        primaryLabel="Request a Free Consultation"
        primaryHref="/contact"
        secondaryLabel="View Pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}
