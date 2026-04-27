import Link from "next/link";
import {
  ArrowRight,
  Phone,
  Search,
  User,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { RemarkableCtaSection } from "@/components/RemarkableCtaSection";
import { TechnologyExpertiseSection } from "@/components/TechnologyExpertiseSection";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { resolveServicesPage } from "@/lib/site-content/resolve-pages";

const PROCESS_ICONS: Record<string, LucideIcon> = {
  Phone,
  Search,
  User,
  Heart,
};

export default async function ServicesPage() {
  const raw = await fetchSiteContentPayload<unknown>("services_page");
  const d = resolveServicesPage(raw);

  return (
    <>
      <section className="bg-[#111111] pb-[149px] pt-[109px] text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">{d.hero.title}</h1>
            <p className="mt-1 max-w-[1031px] text-[18px] leading-7 text-[#e5e5e5]">{d.hero.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-[85px] bg-transparent">
        <div className="tb-container">
          <div className="mx-auto flex h-[170px] max-w-[1136px] items-center rounded-[30px] bg-white px-8 shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)]">
            {d.highlights.map((item, idx) => (
              <div key={item.title} className="flex h-[108px] items-center">
                <div className={`${item.bodyWidth} px-2`}>
                  <h3 className="text-[18px] font-bold leading-7 text-[#111111]">{item.title}</h3>
                  <p className="mt-1 text-[14px] font-normal leading-5 tracking-[0.035px] text-[#666666]">{item.description}</p>
                </div>
                {idx < d.highlights.length - 1 ? <span className="mx-[30px] h-[78px] w-px bg-[#e5e5e5]" aria-hidden /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-[120px] pt-[180px]">
        <div className="tb-container">
          <div className="mx-auto max-w-[1139px]">
            <div className="flex flex-col items-center">
              <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
                <span className="h-1.5 w-1.5 rounded-[3px] bg-[#666666]" aria-hidden />
                <p className="text-[12px] font-medium leading-4 text-[#666666]">{d.engagementSection.eyebrow}</p>
              </div>
              <h2 className="mt-2 text-center text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">
                {d.engagementSection.title}
              </h2>
              <p className="mt-1 text-center text-[18px] font-normal leading-7 text-[#666666]">{d.engagementSection.subtitle}</p>
            </div>

            <div className="relative mt-16 grid grid-cols-3 gap-[20.66px]">
              {d.serviceModels.map((model) => {
                const isFeatured = model.emphasis === "featured";
                return (
                  <div
                    key={model.name}
                    className={
                      isFeatured
                        ? "relative rounded-[24px] border border-[#666666] bg-[#111111] px-[37px] pb-[36px] pt-[39px]"
                        : "rounded-[24px] border border-[#e5e5e5] bg-[#fafafa] px-[37px] pb-[38px] pt-[38px]"
                    }
                  >
                    {isFeatured && model.featuredBadge ? (
                      <span className="absolute left-1/2 top-[-12.97px] -translate-x-1/2 rounded-[100px] bg-[#666666] px-4 py-[5px] text-[12px] font-bold leading-4 text-white">
                        {model.featuredBadge}
                      </span>
                    ) : null}
                    <p className={`text-[12px] font-medium leading-4 ${isFeatured ? "text-[#f7f7f7]" : "text-[#666666]"}`}>{model.name}</p>
                    <h3
                      className={`mt-[5px] text-[28px] font-bold leading-9 tracking-[-0.07px] ${isFeatured ? "mt-[6px] text-white" : "text-[#06091a]"}`}
                    >
                      {model.title}
                    </h3>
                    <p
                      className={`mt-[6px] text-[14px] font-normal leading-5 tracking-[0.035px] ${
                        isFeatured ? "text-[#e5e5e5]" : "whitespace-pre-line text-[#838383]"
                      }`}
                    >
                      {model.description}
                    </p>
                    <div className={`mt-[38px] flex items-end ${isFeatured ? "" : ""}`}>
                      {isFeatured ? (
                        <p
                          className="text-[41.6px] font-extrabold leading-[52px] tracking-[-1.664px] text-white"
                          style={{ fontFamily: "Plus Jakarta Sans, Geist, sans-serif" }}
                        >
                          {model.price}
                        </p>
                      ) : (
                        <>
                          <span className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px] text-[#06091a]">{model.price}</span>
                          {model.priceNote ? (
                            <span className="mb-[6px] text-[14px] font-normal leading-5 tracking-[0.035px] text-[#7a82a0]">
                              {" "}
                              {model.priceNote}
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                    {isFeatured ? (
                      <div className="mt-[36px] space-y-[10px]">
                        {model.features.map((item) => (
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
                    ) : (
                      <div className="mt-[27px] space-y-[10px]">
                        {model.features.map((item) => (
                          <div key={item} className="flex items-center gap-[10px]">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-[10px] bg-white">
                              <span className="h-[10px] w-[10px] rounded-[2px] bg-[#111111]" />
                            </span>
                            <span className="text-[14px] font-normal leading-5 tracking-[0.035px] text-[#111111]">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link
                      href="/contact"
                      className={
                        isFeatured
                          ? "mt-[27px] inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[14px] font-semibold leading-5 text-[#111111]"
                          : "mt-[28px] inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white"
                      }
                    >
                      {model.cta}
                      <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fafafa] py-[120px]">
        <div className="mx-auto w-full max-w-[1139px]">
          <div className="mb-[64px] flex flex-col items-center gap-[36px]">
            <div className="flex w-full justify-end">
              <div className="inline-flex items-center gap-[8px] rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-[12px] py-[6px]">
                <span className="h-[6px] w-[6px] rounded-[3px] bg-[#666666]" />
                <span className="text-[12px] font-medium leading-[16px] text-[#666666]">{d.processSection.eyebrow}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-[4px]">
              <h2 className="text-center text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">{d.processSection.title}</h2>
              <p className="text-center text-[18px] font-normal leading-[28px] text-[#666666]">{d.processSection.subtitle}</p>
            </div>
          </div>

          <div className="relative grid grid-cols-4">
            <div className="pointer-events-none absolute left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] top-[28px] h-[1px] bg-[#e5e5e5]" />

            {d.processSteps.map((step) => {
              const Icon = PROCESS_ICONS[step.icon] ?? Phone;
              return (
                <div key={step.title} className="relative flex flex-col items-center">
                  <div className="relative z-10 mb-[56px] flex h-[56px] w-[56px] items-center justify-center rounded-[28px] border border-[#e5e5e5] bg-white">
                    <Icon className="h-[22px] w-[22px] text-[#111111] stroke-[1.5]" />
                  </div>
                  <h3 className="mb-[8px] text-center text-[16px] font-bold leading-[24px] text-[#111111]">{step.title}</h3>
                  <p className="px-[20px] text-center text-[14px] font-normal leading-[20px] tracking-[0.035px] text-[#666666]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <TechnologyExpertiseSection />

      <RemarkableCtaSection
        title={d.cta.title}
        description={d.cta.description}
        primaryLabel={d.cta.primaryLabel}
        primaryHref={d.cta.primaryHref}
        secondaryLabel={d.cta.secondaryLabel}
        secondaryHref={d.cta.secondaryHref}
      />
    </>
  );
}
