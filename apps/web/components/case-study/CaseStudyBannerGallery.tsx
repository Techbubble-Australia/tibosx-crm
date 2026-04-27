"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Props = {
  images: string[];
  title: string;
};

export function CaseStudyBannerGallery({ images, title }: Props) {
  const safe = useMemo(() => images.filter(Boolean), [images]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx((i) => (safe.length === 0 ? 0 : Math.min(i, safe.length - 1)));
  }, [safe.length]);

  const main = safe[idx] ?? safe[0] ?? "";

  if (!main) {
    return (
      <div className="flex h-[307px] items-center justify-center rounded-[8px] bg-neutral-200 text-neutral-500">
        No banner image
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-[307px] overflow-hidden rounded-[8px] ring-1 ring-black/5">
        <Image
          key={main}
          src={main}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1136px"
          priority
        />
      </div>
      {safe.length > 1 ? (
        <div
          className="mt-3 flex flex-wrap gap-2 sm:gap-3"
          role="tablist"
          aria-label={`${title} banner images`}
        >
          {safe.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={`Banner image ${i + 1} of ${safe.length}`}
              onClick={() => setIdx(i)}
              className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:h-16 sm:w-28 ${
                i === idx
                  ? "border-black ring-2 ring-black/20"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
