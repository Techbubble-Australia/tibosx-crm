import Link from "next/link";
import { ArrowRight, Check, Mail } from "lucide-react";

type RemarkableCtaSectionProps = {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  className?: string;
};

export function RemarkableCtaSection({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  className = "bg-[#f7f7f7] py-[60px]",
}: RemarkableCtaSectionProps) {
  return (
    <section className={className}>
      <div className="tb-container">
        <div className="mx-auto grid max-w-[1136px] grid-cols-1 gap-8 lg:grid-cols-[1fr_353px]">
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">{title}</h2>
            <p className="mt-2 max-w-[751px] text-[18px] leading-7 text-[#666666]">{description}</p>
            <div className="mt-2 h-[84px] pt-4">
              <div className="flex items-center gap-[22px]">
                <Link
                  href={primaryHref}
                  className="inline-flex h-[52px] min-w-[229px] whitespace-nowrap px-7 items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold text-white"
                >
                  {primaryLabel}
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                </Link>
                <Link
                  href={secondaryHref}
                  className="inline-flex h-[52px] w-[161px] items-center justify-center rounded-[18px] border border-[#e5e5e5] bg-white text-[16px] font-semibold text-[#111111]"
                >
                  {secondaryLabel}
                </Link>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
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

            <div className="mt-8 space-y-4">
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
  );
}