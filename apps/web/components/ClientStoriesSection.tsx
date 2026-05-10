"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionPill } from "@/components/ui/SectionPill";

export type ClientStoryItem = {
  quote: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  authorInitials: string;
  authorImageUrl?: string;
};

type Props = {
  items?: ClientStoryItem[];
};

export function ClientStoriesSection({ items }: Props) {
  const list = items && items.length > 0 ? items : [];
  const [index, setIndex] = useState(0);
  const t = list[index];

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const n = list.length;
        return ((i + delta) % n + n) % n;
      });
    },
    [list.length],
  );

  if (!t) {
    return (
      <section className="border-t border-[#e5e5e5] bg-white py-16">
        <div className="tb-container">
          <p className="text-center text-[16px] text-[#666666]">
            Client stories load from the API when testimonials are published in admin.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-[120px]">
      <div className="tb-container">
        <div className="mx-auto max-w-[1139px]">
          <div className="mb-12">
            <SectionPill label="Client Stories" className="mb-6" />
            <h2 className="text-3xl font-bold leading-tight tracking-[-0.005em] text-[#111111] md:text-5xl lg:text-[56px] lg:leading-[64px]">
              Trusted by people <br />
              who know technology best
            </h2>
          </div>

          <p className="text-xl font-medium leading-9 tracking-[-0.0025em] text-[#666666] md:text-[28px]">
            &ldquo;{t.quote}&rdquo;
          </p>

          <div className="my-10 h-px w-full bg-[#e5e5e5]" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {t.authorImageUrl ? (
                <div className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-full bg-[#e5e5e5]">
                  <Image src={t.authorImageUrl} alt="" fill className="object-cover" sizes="62px" />
                </div>
              ) : (
                <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-[#e5e5e5] text-sm font-semibold text-[#111111]">
                  {t.authorInitials}
                </div>
              )}
              <div>
                <p className="text-[18px] font-bold leading-6 tracking-[-0.0025em] text-[#06091a]">{t.authorName}</p>
                <p className="mt-1 text-[16px] leading-6 text-[#838383]">
                  {t.authorTitle} · {t.authorCompany}
                </p>
                <p className="mt-1 text-[14px] tracking-[2px] text-[#f59e0b]">★★★★★</p>
              </div>
            </div>

            {list.length > 1 ? (
              <div className="flex gap-4">
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={() => go(-1)}
                  className="flex h-10 w-14 items-center justify-center rounded-[100px] border border-[#585858] bg-transparent transition-colors hover:bg-[#f5f5f5]"
                >
                  <ChevronLeft className="h-6 w-6 text-[#585858]" strokeWidth={1.5} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={() => go(1)}
                  className="flex h-10 w-14 items-center justify-center rounded-[100px] border border-[#585858] bg-transparent transition-colors hover:bg-[#f5f5f5]"
                >
                  <ChevronRight className="h-6 w-6 text-[#585858]" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
