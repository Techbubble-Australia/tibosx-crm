import Image from "next/image";
import Link from "next/link";
import { Linkedin, Facebook, Instagram, Clock, type LucideIcon } from "lucide-react";
import footerLogo from "@image/techbubble_-_home_36.png";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { CountryFlagCode } from "@/components/ui/CountryFlag";
import type { SiteFooterPayload } from "@/lib/site-content/resolve-pages";

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  LinkedIn: Linkedin,
  Facebook,
  Instagram,
};

export function Footer({ data }: { data: SiteFooterPayload }) {
  return (
    <footer className="bg-[#111111] pt-[82px]">
      <div className="tb-container">
        <div className="mx-auto max-w-[1136px]">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 md:gap-x-[56px] lg:grid-cols-[264px_176px_176px_minmax(0,1fr)]">
            <div>
              <Image src={footerLogo} alt="TechBubble" className="h-[68px] w-[145px] object-contain" />
              <p className="mt-[14px] text-[14px] leading-5 tracking-[0.035px] text-white">{data.tagline}</p>
              <div className="mt-[32px] flex items-center gap-2">
                {data.social.map(({ href, label }) => {
                  const Icon = SOCIAL_ICONS[label] ?? Linkedin;
                  return (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-white/10 bg-white/[0.06] text-white/90 transition-colors hover:bg-white/15"
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-[16px] font-bold leading-6 text-white">Company</h3>
              <div className="mt-3 space-y-[18px]">
                {data.companyLinks.map((item) => (
                  <Link key={item.label} href={item.href} className="block text-[12px] font-medium leading-4 text-[#666666]">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[16px] font-bold leading-6 text-white">Services</h3>
              <div className="mt-3 space-y-[18px]">
                {data.serviceLinks.map((item) => (
                  <Link key={`${item.label}-${item.href}`} href={item.href} className="block text-[12px] font-medium leading-4 text-[#666666]">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="min-w-0 lg:min-w-[280px]">
              <h3 className="text-[16px] font-bold leading-6 text-white">{data.officesHeading}</h3>

              <div className="mt-3 space-y-[19px] min-w-0">
                {data.offices.map((office) => (
                  <div key={`${office.region}-${office.entity}`} className="break-words">
                    <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold leading-5 text-white min-w-0">
                      <CountryFlag code={office.flagCode as CountryFlagCode} height={18} label={office.region} />
                      <span className="break-words">
                        {office.region} <span className="px-2 text-white/75">|</span> {office.entity}
                      </span>
                    </div>
                    <p className="mt-[1px] break-words text-[12px] font-medium leading-4 text-[#666666] dark:text-zinc-400">
                      {office.address}
                    </p>
                    {office.businessNumber?.trim() ? (
                      <p className="mt-1 break-words text-[12px] font-medium leading-4 text-[#888888] dark:text-zinc-500">
                        {office.businessNumber.trim()}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              <h4 className="mt-[18px] text-[14px] font-semibold leading-5 text-white">{data.contactInfoHeading}</h4>
              <div className="mt-[2px] space-y-0 text-[12px] font-medium leading-4 text-[#666666]">
                {data.contactLines.map((line) => (
                  <a key={`${line.kind}-${line.href}`} href={line.href} className="block">
                    {line.display}
                  </a>
                ))}
                <p className="flex flex-wrap items-center gap-2 pt-[2px] text-[12px] font-medium leading-4 text-[#666666]">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#666666]" strokeWidth={2} aria-hidden />
                  <span>{data.hoursLine}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-[28px] flex flex-col items-start gap-3 border-t border-white/[0.06] pb-[4px] pt-4 sm:flex-row sm:h-[50px] sm:items-end sm:justify-between">
            <p className="text-[12px] font-bold leading-4 text-[#666666]">{data.copyright}</p>
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="text-[12px] font-bold leading-4 text-[#666666] hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="text-[12px] font-bold leading-4 text-[#666666] hover:text-white">
                Terms
              </Link>
              <Link href="/cookies" className="text-[12px] font-bold leading-4 text-[#666666] hover:text-white">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
