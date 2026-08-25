type TechBubbleLogoProps = {
  className?: string;
  compact?: boolean;
};

const LOGO_SRC = "/techbubble-logo.png";
const LOGO_WIDTH = 93;
const LOGO_HEIGHT = 40;

/** Official TechBubble logo (hexagon mark + wordmark PNG). */
export function TechBubbleLogo({ className = "", compact = false }: TechBubbleLogoProps) {
  const heightClass = compact ? "h-8" : "h-10";

  return (
    <span className={`inline-flex min-w-0 items-center ${className}`}>
      <img
        src={LOGO_SRC}
        alt="TechBubble"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={`w-auto ${heightClass} dark:brightness-0 dark:invert`}
        decoding="async"
      />
    </span>
  );
}
