type TechBubbleLogoProps = {
  className?: string;
  compact?: boolean;
};

/** Inline SVG logo — no static file / image optimizer dependency. */
export function TechBubbleLogo({ className = "", compact = false }: TechBubbleLogoProps) {
  const heightClass = compact ? "h-8" : "h-10";

  return (
    <span className={`inline-flex min-w-0 items-center ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 58"
        role="img"
        aria-label="TechBubble"
        className={`w-auto ${heightClass} text-[#0a0a0a] dark:brightness-0 dark:invert`}
      >
        <g fill="currentColor" stroke="currentColor" strokeWidth="0.25" strokeLinejoin="round">
          <polygon points="100.00,7.30 105.37,10.40 105.37,16.60 100.00,19.70 94.63,16.60 94.63,10.40" />
          <polygon points="89.50,25.49 94.87,28.59 94.87,34.79 89.50,37.89 84.13,34.79 84.13,28.59" />
          <polygon points="110.50,25.49 115.87,28.59 115.87,34.79 110.50,37.89 105.13,34.79 105.13,28.59" />
        </g>
        <text
          x="100"
          y="52"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="12.5"
          fontWeight="800"
          letterSpacing="0.14em"
          textLength="168"
          lengthAdjust="spacingAndGlyphs"
        >
          TECHBUBBLE
        </text>
      </svg>
    </span>
  );
}
