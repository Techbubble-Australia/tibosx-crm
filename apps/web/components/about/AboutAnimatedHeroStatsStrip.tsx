"use client";

import { useStatCountUpOnView } from "@/hooks/useStatCountUpOnView";
import { useMemo } from "react";

export type AboutHeroStatItem = { n: string; l: string; labelClass: string };

type Props = {
  stats: AboutHeroStatItem[];
};

/** Overlapping white stat strip under the About hero — same count-up as homepage stats. */
export function AboutAnimatedHeroStatsStrip({ stats }: Props) {
  const raw = useMemo(() => stats.map((s) => s.n), [stats]);
  const { ref, formatAt } = useStatCountUpOnView<HTMLDivElement>(raw);

  return (
    <div ref={ref} className="mx-auto flex max-w-[1136px] flex-wrap items-stretch rounded-[30px] bg-white shadow-[0_24px_48px_-26px_rgba(0,0,0,0.38)] sm:flex-nowrap">
      {stats.map((stat, idx) => (
        <div key={stat.l} className="flex flex-1 items-center justify-center px-4 py-6">
          <div className="text-center">
            <p className="text-4xl font-bold leading-tight tracking-[-0.28px] text-[#111111] md:text-5xl lg:text-[56px]">{formatAt(idx)}</p>
            <p className={`${stat.labelClass} text-[#666666]`}>{stat.l}</p>
          </div>
          {idx < stats.length - 1 ? (
            <span className="ml-4 hidden h-[78px] w-px bg-[#e5e5e5] sm:block" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}
