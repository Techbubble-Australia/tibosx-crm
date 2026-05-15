"use client";

import { useStatCountUpOnView } from "@/hooks/useStatCountUpOnView";
import { useMemo } from "react";

type Props = {
  stats: { n: string; l: string }[];
};

/** Dark bar stats under "Meet Our Entire Workforce" — same count-up as homepage. */
export function AboutAnimatedWorkforceStats({ stats }: Props) {
  const raw = useMemo(() => stats.map((s) => s.n), [stats]);
  const { ref, formatAt } = useStatCountUpOnView<HTMLDivElement>(raw);

  return (
    <div ref={ref} className="mx-auto mt-8 w-full max-w-[944px] rounded-[21px] bg-[#111111] px-6 py-8">
      <div className="flex flex-wrap items-center justify-around gap-8">
        {stats.map((s, idx) => (
          <div key={`${s.l}-${idx}`} className="flex items-center">
            <div className="text-center">
              <p className="text-3xl font-semibold leading-[48px] tracking-[-0.1px] text-white md:text-[40px]">{formatAt(idx)}</p>
              <p className="text-[12px] font-medium leading-4 text-[#f7f7f7]">{s.l}</p>
            </div>
            {idx < stats.length - 1 ? (
              <span className="mx-[30px] hidden h-[78px] w-px bg-white/[0.17] md:block" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
