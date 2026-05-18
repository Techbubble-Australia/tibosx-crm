import { cn } from "@/lib/utils";
import type { SiteFooterFlagCode } from "@site-content/defaults";

export type CountryFlagCode = SiteFooterFlagCode;

type CountryFlagProps = {
  code: CountryFlagCode;
  /** Pixel size (square); SVG assets are 1:1 */
  height?: number;
  className?: string;
  /** When false, exposed as `role="img"` with this label. When true, `aria-hidden` (caption nearby). */
  decorative?: boolean;
  /** Accessible name when `decorative` is false */
  label?: string;
};

/**
 * Static SVG from `/public/flags/` — reliable across OS/fonts (emoji flags often render as tofu).
 */
export function CountryFlag({ code, height = 28, className, decorative = false, label }: CountryFlagProps) {
  const size = height;
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      className={cn("inline-flex shrink-0 items-center overflow-hidden", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG asset */}
      <img src={`/flags/${code}.svg`} width={size} height={size} alt="" className="block object-cover" />
    </span>
  );
}
