"use client";

import Image from "next/image";

type TechBubbleLogoProps = {
  className?: string;
  priority?: boolean;
};

/** TechBubble stacked logo — switches for light/dark mode. */
export function TechBubbleLogo({ className = "", priority = false }: TechBubbleLogoProps) {
  return (
    <>
      <Image
        src="/techbubble-logo-stacked-black.svg"
        alt="TechBubble"
        width={160}
        height={46}
        className={`h-10 w-auto dark:hidden ${className}`}
        priority={priority}
      />
      <Image
        src="/techbubble-logo-stacked-white.svg"
        alt="TechBubble"
        width={160}
        height={46}
        className={`hidden h-10 w-auto dark:block ${className}`}
        priority={priority}
      />
    </>
  );
}
