type TechBubbleLogoProps = {
  className?: string;
  compact?: boolean;
};

/** TechBubble wordmark — 2×2 dot grid + TECHBUBBLE (admin brand mark). */
export function TechBubbleLogo({ className = "", compact = false }: TechBubbleLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span className="grid shrink-0 grid-cols-2 gap-0.5" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-black dark:bg-white" />
        <span className="h-2 w-2 rounded-full bg-black dark:bg-white" />
        <span className="h-2 w-2 rounded-full bg-black dark:bg-white" />
        <span className="h-2 w-2 rounded-full bg-black dark:bg-white" />
      </span>
      {!compact ? (
        <span className="truncate text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          TECHBUBBLE
        </span>
      ) : null}
    </span>
  );
}
