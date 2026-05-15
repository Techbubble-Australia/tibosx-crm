import Link from "next/link";
import { ArrowRight, Mail, Clock } from "lucide-react";
import { SectionPill } from "@/components/ui/SectionPill";
import { fetchSiteContentPayload } from "@/lib/fetch-site-content";
import { resolveContactPage } from "@/lib/site-content/resolve-pages";

export default async function ContactPage() {
  const raw = await fetchSiteContentPayload<unknown>("contact_page");
  const c = resolveContactPage(raw ?? {});

  return (
    <>
      <section className="bg-[#111111] pb-[59px] pt-20 text-white">
        <div className="tb-container">
          <div className="mx-auto max-w-[1136px]">
            <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">{c.hero.title}</h1>
            <p className="mt-1 max-w-[968px] text-[18px] leading-7 text-[#e5e5e5]">{c.hero.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-[60px]">
        <div className="tb-container">
          <div className="mx-auto grid max-w-[1136px] grid-cols-1 gap-10 lg:grid-cols-[536px_1fr] lg:gap-[113px]">
            <div>
              <SectionPill label={c.left.pill} />

              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">
                {c.left.title}
              </h2>
              <p className="mt-1 text-[18px] leading-7 text-[#666666]">{c.left.body}</p>

              <div className="mt-4 space-y-2">
                {c.left.channels.map((item, index) => (
                    <a
                      key={`${item.href}-${index}`}
                      href={item.href}
                      className="block w-full rounded-[15px] border border-[#e5e5e5] bg-[#fafafa] px-4 py-4 transition-colors hover:bg-[#f5f5f5]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 rounded-[4px] bg-[#666666]" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-[16px] font-semibold leading-6 text-[#06091a]">{item.title}</p>
                          <p className="mt-1 text-[12px] font-medium leading-4 text-[#666666]">{item.content}</p>
                        </div>
                      </div>
                    </a>
                  ))}
              </div>

              <div className="mt-12">
                <SectionPill label={c.left.officesPill} tone="dark" />

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {c.left.offices.map((office, index) => (
                    <div key={`${office.country}-${index}`} className="rounded-[15px] border border-[#e5e5e5] bg-[#fafafa] p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-[16px] leading-6" aria-hidden>
                          {office.flagEmoji}
                        </span>
                        <span className="text-[16px] font-semibold leading-6 text-[#06091a]">{office.country}</span>
                      </div>
                      <p className="mt-1 text-[12px] font-medium leading-4 text-[#666666]">{office.address}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 rounded-[15px] border border-[#e5e5e5] bg-[#fafafa] p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-[16px] w-[16px] text-[#06091a]" aria-hidden />
                  <p className="text-[16px] font-semibold leading-6 text-[#06091a]">{c.left.businessHours.title}</p>
                </div>

                <div className="mt-1 space-y-1">
                  {c.left.businessHours.rows.map((row, index) =>
                    "divider" in row && row.divider ? (
                      <div key={`div-${index}`} className="my-1 h-px bg-[#e5e5e5]" aria-hidden />
                    ) : (
                      <div key={`row-${index}`} className="flex justify-between text-[12px] leading-4">
                        <span className="font-medium text-[#666666]">{(row as { label: string }).label}</span>
                        <span className="font-bold text-[#111111]">{(row as { value: string }).value}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.12] bg-[#111111] px-[37px] py-8 text-white">
              <h3 className="text-[28px] font-bold leading-9 tracking-[-0.07px]">{c.form.title}</h3>
              <p className="mt-1 max-w-[327px] text-[14px] leading-5 tracking-[0.035px] text-[#e5e5e5]">{c.form.subtitle}</p>

              <form className="mt-8 space-y-[14px]">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder={c.form.placeholders.firstName}
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder={c.form.placeholders.lastName}
                    className="h-[46px] rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                  />
                </div>
                <input
                  type="email"
                  placeholder={c.form.placeholders.email}
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder={c.form.placeholders.phone}
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={c.form.placeholders.company}
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={c.form.placeholders.lookingFor}
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={c.form.placeholders.region}
                  className="h-[46px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-[17px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <textarea
                  placeholder={c.form.placeholders.message}
                  rows={4}
                  className="h-[100px] w-full resize-none rounded-[14px] border border-white/15 bg-white/[0.08] px-[19px] py-[14px] text-[14px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-white text-[16px] font-semibold leading-6 text-[#111111]"
                >
                  {c.form.submitLabel}
                  <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </button>
              </form>

              <p className="mt-4 text-center text-[12px] font-medium leading-4 text-[#e5e5e5]">{c.form.footerNote}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fafafa] py-[60px]">
        <div className="tb-container">
          <div className="mx-auto flex max-w-[1136px] items-start justify-between">
            <div>
              <h2 className="w-[751px] text-[56px] font-bold leading-[64px] tracking-[-0.28px] text-[#111111]">{c.talentCta.title}</h2>
              <p className="mt-2 max-w-[666px] text-[18px] leading-7 text-[#666666]">{c.talentCta.body}</p>
            </div>
            <div className="w-[353px] pt-[38px]">
              <div className="ml-8 flex w-[289px] items-center gap-3">
                <Link
                  href={c.talentCta.emailHref}
                  className="inline-flex h-[51px] w-[118px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white"
                >
                  <Mail className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  {c.talentCta.emailCtaLabel}
                </Link>
                <a
                  href={c.talentCta.phoneHref}
                  className="inline-flex h-[51px] w-[159px] items-center justify-center rounded-[18px] border border-[#e5e5e5] bg-[#e5e5e5] text-[14px] font-semibold text-[#111111]"
                >
                  {c.talentCta.phoneCtaLabel}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
