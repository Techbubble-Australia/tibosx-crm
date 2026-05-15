"use client";

import { useStatCountUpOnView } from "@/hooks/useStatCountUpOnView";
import { useMemo } from "react";

type Props = {
  metrics: { n: string; l: string }[];
};

/** Mission sidebar metric tiles in Our Values — same count-up easing as homepage stats. */
export function AboutAnimatedMissionStatCards({ metrics }: Props) {
  const raw = useMemo(() => metrics.map((m) => m.n), [metrics]);
  const { ref, formatAt } = useStatCountUpOnView<HTMLDivElement>(raw);

  return (
    <div ref={ref} className="flex flex-wrap gap-[18px] px-[27px] pb-[39px]">
      {metrics.map((m, idx) => (
        <div
          key={`${m.l}-${idx}`}
          className="flex h-[85px] w-[228px] flex-col justify-center rounded-[10px] border border-[#e5e5e5] bg-[#fafafa] px-[27px]"
        >
          <p className="text-[28px] font-medium leading-9 tracking-[-0.07px] text-[#111111]">{formatAt(idx)}</p>
          <p className="text-[12px] font-medium leading-4 text-[#666666]">{m.l}</p>
        </div>
      ))}
    </div>
  );
}
