type TechBubbleLogoProps = {
  className?: string;
  compact?: boolean;
  /** `sidebar` = horizontal mark + wordmark for the dashboard nav; `stacked` = icon above text (login, etc.) */
  variant?: "stacked" | "sidebar";
  /** Show TIBOSX product label beside the logo (sidebar). */
  showProductLabel?: boolean;
};

const STACKED_LOGO = {
  src: "/techbubble-logo.png",
  width: 93,
  height: 40,
};

const SIDEBAR_LOGO = {
  src: "/techbubble-logo-sidebar.png",
  width: 108,
  height: 28,
};

/** Official TechBubble logo PNGs. */
export function TechBubbleLogo({
  className = "",
  compact = false,
  variant = "stacked",
  showProductLabel = false,
}: TechBubbleLogoProps) {
  const useSidebarLogo = variant === "sidebar" && !compact;
  const asset = useSidebarLogo ? SIDEBAR_LOGO : STACKED_LOGO;
  const heightClass = compact ? "h-7" : useSidebarLogo ? "h-7" : "h-10";

  return (
    <span
      className={`inline-flex min-w-0 ${useSidebarLogo && showProductLabel && !compact ? "flex-col items-start gap-1" : "items-center gap-2"} ${className}`}
    >
      <img
        src={asset.src}
        alt="TechBubble"
        width={asset.width}
        height={asset.height}
        className={`w-auto max-w-full shrink-0 ${heightClass} dark:brightness-0 dark:invert`}
        decoding="async"
      />
      {showProductLabel && !compact ? (
        <span className="whitespace-nowrap text-sm font-bold leading-none tracking-wide text-gray-900 dark:text-gray-100">
          TIBOSX
        </span>
      ) : null}
    </span>
  );
}
