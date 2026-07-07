"use client";

import { cn } from "@/lib/utils";

type CountryFlagProps = {
  code: string;
  height?: number;
  className?: string;
  decorative?: boolean;
  label?: string;
};

/** Static SVG from `/public/flags/{code}.svg` (lowercase ISO 3166-1 alpha-2). */
export function CountryFlag({ code, height = 28, className, decorative = false, label }: CountryFlagProps) {
  const normalized = code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(normalized)) return null;

  const size = height;
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      className={cn("inline-flex shrink-0 items-center overflow-hidden", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG asset */}
      <img
        src={`/flags/${normalized}.svg`}
        width={size}
        height={size}
        alt=""
        className="block rounded-sm object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </span>
  );
}
