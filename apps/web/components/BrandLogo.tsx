import Image from "next/image";
import techbubbleLogo from "@/src/image/techbubble-logo.png";

type BrandLogoProps = {
  /** Light background → black logo; dark background → inverted to white */
  variant: "onLight" | "onDark";
  className?: string;
  priority?: boolean;
};

/** Official Techbubble mark — raster asset in `src/image`, no inline SVG. */
export function BrandLogo({ variant, className = "", priority = false }: BrandLogoProps) {
  return (
    <Image
      src={techbubbleLogo}
      alt="Techbubble"
      width={93}
      height={40}
      sizes="(max-width: 768px) 120px, 140px"
      className={`h-10 w-auto sm:h-11 ${variant === "onDark" ? "brightness-0 invert" : ""} ${className}`}
      priority={priority}
    />
  );
}
