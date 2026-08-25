import Image from "next/image";

type TechBubbleLogoProps = {
  className?: string;
  compact?: boolean;
};

/** Official TechBubble logo (hexagon mark + wordmark). */
export function TechBubbleLogo({ className = "", compact = false }: TechBubbleLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center ${className}`}>
      <Image
        src="/techbubble-logo.png"
        alt="TechBubble"
        width={93}
        height={40}
        className={`w-auto ${compact ? "h-8" : "h-10"} dark:brightness-0 dark:invert`}
        priority
      />
    </span>
  );
}
