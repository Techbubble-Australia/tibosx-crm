import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type ArticleBottomCtaProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

/**
 * Full-width band CTA (case study detail + listing). Buttons share height and align in a row from `sm` up.
 */
export function ArticleBottomCta({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: ArticleBottomCtaProps) {
  const pill =
    "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[18px] px-6 text-center text-sm font-semibold leading-tight transition-colors sm:w-auto sm:shrink-0 sm:whitespace-nowrap sm:px-7 sm:text-[15px]";

  return (
    <section className="border-t border-neutral-200 bg-neutral-50 py-14 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="tb-container w-full">
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-neutral-900 dark:text-neutral-50 md:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">{description}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-[18px]">
            <Link
              href={primaryHref}
              className={`${pill} bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200`}
            >
              {primaryLabel}
              <ArrowRight className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
            </Link>
            <Link
              href={secondaryHref}
              className={`${pill} border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800`}
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
