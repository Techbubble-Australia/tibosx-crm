import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { RemarkableCtaSection } from "@/components/RemarkableCtaSection";
import { PricingFaqList } from "@/components/pricing/PricingFaqList";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { getPublishedFaqs } from "@/lib/api/public";
import { resolvePricingPage } from "@/lib/site-content/resolve-pages";

export default async function PricingPage() {
  const [raw, apiFaqs] = await Promise.all([
    fetchSiteContentPayload<unknown>("pricing_page"),
    getPublishedFaqs(),
  ]);
  const d = resolvePricingPage(raw);
  const faqs = apiFaqs.length > 0 ? apiFaqs : d.faqs;

  return (
    <>
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">{d.hero.title}</h1>
            <p className="mt-[4px] text-[18px] font-normal leading-[28px] text-[#e5e5e5]">{d.hero.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-[84px] bg-transparent">
        <div className="tb-container">
          <div className="mx-auto flex h-[170px] max-w-[1136px] items-center rounded-[30px] bg-white px-8 shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            {d.valueStrip.map((item, idx) => (
              <div key={item.text} className="flex h-[72px] items-center">
                <div className={`${item.width} text-center`}>
                  <p className="text-[18px] font-bold leading-7 text-[#111111]">{item.text}</p>
                </div>
                {idx < d.valueStrip.length - 1 ? <span className="mx-[22.625px] h-[78px] w-px bg-[#e5e5e5]" aria-hidden /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="tb-container">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {d.cardsSection.eyebrow}
            </span>
            <h2 className="mb-4 text-3xl font-bold">{d.cardsSection.title}</h2>
            <p className="text-gray-500">{d.cardsSection.subtitle}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {d.models.map((model, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  model.popular ? "bg-[#0a0a0a] text-white ring-2 ring-black" : "border border-gray-100 bg-white"
                }`}
              >
                {model.popular ? (
                  <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                    Most Popular
                  </div>
                ) : null}
                <div className={`mb-2 text-xs font-medium ${model.popular ? "text-gray-400" : "text-gray-500"}`}>{model.name}</div>
                <h3 className="mb-2 text-2xl font-bold">{model.title}</h3>
                <p className={`mb-6 text-sm ${model.popular ? "text-gray-400" : "text-gray-500"}`}>{model.description}</p>

                <div className="mb-6">
                  <span className="text-3xl font-bold">{model.price}</span>
                  {model.priceNote ? (
                    <span className={`ml-2 text-sm ${model.popular ? "text-gray-400" : "text-gray-500"}`}>/ {model.priceNote}</span>
                  ) : null}
                </div>

                <ul className="mb-8 space-y-3">
                  {model.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${model.popular ? "text-gray-400" : "text-gray-500"}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full py-3 font-medium transition-colors ${
                    model.popular ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {model.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden py-[162px] text-white"
        style={{ background: "linear-gradient(160deg, #000000 0%, #202020 55%, #101112 100%)" }}
      >
        <div className="pointer-events-none absolute -left-[120px] bottom-[-120px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(76,76,76,0.12)_0%,rgba(56,56,56,0)_65%)]" />
        <div className="pointer-events-none absolute -right-[120px] top-[-100px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(127,127,127,0.1)_0%,rgba(142,142,142,0)_65%)]" />

        <div className="tb-container relative">
          <div className="mx-auto grid max-w-[1136px] grid-cols-[604px_489px] gap-[43px]">
            <div>
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#111111]">{d.rateCardSection.eyebrow}</p>
              </div>

              <h2 className="mt-4 text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-white">{d.rateCardSection.title}</h2>
              <p className="mt-1 text-[18px] font-normal leading-7 text-[#e5e5e5]">{d.rateCardSection.subtitle}</p>

              <div className="mt-4 space-y-[10px]">
                {d.rateCardSection.bullets.map((item) => (
                  <div key={item} className="flex items-center gap-[10px]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-[10px] bg-white/12">
                      <span className="h-[10px] w-[10px] rounded-[2px] bg-white" />
                    </span>
                    <span
                      className="text-[14px] font-normal leading-[23.1px] text-[#e5e5e5]"
                      style={{ fontFamily: "Figtree, Geist, sans-serif" }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-[54px] flex items-center gap-[26px]">
                {d.rateCardSection.footerChips.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[9px] border border-[#e5e5e5] bg-[#fafafa]">
                      <span className="h-[10px] w-[10px] rounded-[2px] bg-[#111111]" />
                    </span>
                    <span className="text-[12px] font-medium leading-4 text-[#e5e5e5]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-white/[0.06] px-[37px] py-8">
              <h3 className="text-[28px] font-bold leading-9 tracking-[-0.07px] text-white">{d.rateCardSection.formTitle}</h3>
              <p className="mt-1 text-[14px] font-normal leading-5 tracking-[0.035px] text-[#e5e5e5]">{d.rateCardSection.formSubtitle}</p>

              <form className="mt-8 space-y-[14px]">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                </div>

                <input
                  type="email"
                  placeholder="Work Email"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-4 text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <div className="relative">
                  <select className="h-[46px] w-full appearance-none rounded-[14px] border border-white/15 bg-white/[0.08] px-4 pr-10 text-[14px] text-white/65 focus:outline-none">
                    <option value="">Select service type</option>
                    <option>Staff Augmentation</option>
                    <option>Project Delivery</option>
                    <option>Product Engineering</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" aria-hidden />
                </div>

                <button
                  type="submit"
                  className="mt-[18px] inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[16px] font-semibold leading-6 text-[#111111]"
                >
                  {d.rateCardSection.formSubmitLabel}
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <PricingFaqList
        items={faqs}
        aside={{
          eyebrow: d.faqSection.eyebrow,
          titleLines: d.faqSection.titleLines,
          blurb: d.faqSection.asideBlurb,
          ctaLabel: d.faqSection.asideCtaLabel,
          ctaHref: d.faqSection.asideCtaHref,
        }}
      />

      <RemarkableCtaSection
        title={d.closingCta.title}
        description={d.closingCta.description}
        primaryLabel={d.closingCta.primaryLabel}
        primaryHref={d.closingCta.primaryHref}
        secondaryLabel={d.closingCta.secondaryLabel}
        secondaryHref={d.closingCta.secondaryHref}
      />
    </>
  );
}
