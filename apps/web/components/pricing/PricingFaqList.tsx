"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";

export type PricingFaqItem = { question: string; answer: string };

type Props = {
  items: PricingFaqItem[];
  aside: {
    eyebrow: string;
    titleLines: string[];
    blurb: string;
    ctaLabel: string;
    ctaHref: string;
  };
};

export function PricingFaqList({ items, aside }: Props) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-white py-[112px]">
      <div className="tb-container">
        <div className="mx-auto grid max-w-[1136px] grid-cols-1 gap-10 lg:grid-cols-[360px_1fr] lg:gap-[72px]">
          <div>
            <div className="inline-flex h-7 items-center gap-2 rounded-[24px] border border-[#e5e5e5] bg-[#f7f7f7] px-3">
              <span className="h-1.5 w-1.5 rounded-[3px] bg-[#111111]" aria-hidden />
              <p className="text-[12px] font-medium leading-4 text-[#111111]">{aside.eyebrow}</p>
            </div>

            <h2 className="mt-[6px] text-3xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">
              {aside.titleLines.map((line, i) => (
                <span key={`${line}-${i}`}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>

            <p className="mt-4 text-[18px] font-normal leading-7 text-[#666666]">{aside.blurb}</p>

            <Link
              href={aside.ctaHref}
              className="mt-8 inline-flex h-[43px] w-[125px] items-center justify-center gap-2 rounded-[18px] bg-[#111111] text-[14px] font-semibold leading-5 text-white"
            >
              {aside.ctaLabel}
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </Link>
          </div>

          <div className="space-y-2">
            {items.map((faq, index) => {
              const open = openIndex === index;
              return (
                <div key={faq.question} className="rounded-[16px] border border-[#f7f7f7] bg-[#fafafa]">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? -1 : index)}
                    className="flex h-16 w-full items-center justify-between px-[22px] text-left"
                  >
                    <h3 className={`pr-4 text-[16px] font-bold leading-6 ${open ? "text-[#111111]" : "text-[#666666]"}`}>
                      {faq.question}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center justify-center rounded-[14px] ${
                        open
                          ? "h-10 w-10 border border-[#111111] bg-[#111111] text-white"
                          : "h-7 w-7 border border-[#e5e5e5] bg-[#fafafa] text-[#666666]"
                      }`}
                      aria-hidden
                    >
                      {open ? <Minus className="h-5 w-5" strokeWidth={2.25} /> : <Plus className="h-[14px] w-[14px]" strokeWidth={2.25} />}
                    </span>
                  </button>
                  {open ? (
                    <div className="px-[22px] pb-5">
                      <p className="text-[16px] font-normal leading-6 text-[#666666]">{faq.answer}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
