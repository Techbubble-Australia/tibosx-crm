"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionPill } from "@/components/ui/SectionPill";
import { UploadableImage } from "@/components/media/UploadableImage";

export type ClientStoryItem = {
  quote: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  authorInitials: string;
  authorImageUrl?: string;
};

const DEFAULT_AUTO_SLIDE_MS = 1000;

type Props = {
  items?: ClientStoryItem[];
  /** Auto-advance; default {@link DEFAULT_AUTO_SLIDE_MS}. Set `0` or negative to disable. */
  autoSlideIntervalMs?: number;
};

export function ClientStoriesSection({ items, autoSlideIntervalMs = DEFAULT_AUTO_SLIDE_MS }: Props) {
  const list = items && items.length > 0 ? items : [];
  const [index, setIndex] = useState(0);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [hoverPause, setHoverPause] = useState(false);
  const t = list[index];

  useEffect(() => {
    setAvatarBroken(false);
  }, [index, t?.authorImageUrl]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const n = list.length;
        return ((i + delta) % n + n) % n;
      });
    },
    [list.length],
  );

  useEffect(() => {
    if (list.length <= 1) return;
    const ms = autoSlideIntervalMs;
    if (ms == null || ms <= 0) return;
    if (hoverPause) return;
    const id = window.setInterval(() => {
      go(1);
    }, ms);
    return () => window.clearInterval(id);
  }, [list.length, go, autoSlideIntervalMs, hoverPause]);

  if (!t) {
    return (
      <section className="border-t border-[#e5e5e5] bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="tb-container">
          <p className="text-center text-[16px] text-[#666666]">
            Client stories load from the API when testimonials are published in admin.
          </p>
        </div>
      </section>
    );
  }

  const avatarSrc = t.authorImageUrl?.trim();
  const showPhoto = Boolean(avatarSrc) && !avatarBroken;

  return (
    <section
      className="bg-white py-[60px] dark:bg-zinc-950"
      onMouseEnter={() => setHoverPause(true)}
      onMouseLeave={() => setHoverPause(false)}
    >
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
              {showPhoto ? (
                <div className="relative h-[62px] w-[62px] shrink-0 overflow-hidden rounded-full bg-[#e5e5e5] dark:bg-zinc-700">
                  <UploadableImage
                    src={avatarSrc!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="62px"
                    onError={() => setAvatarBroken(true)}
                  />
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
