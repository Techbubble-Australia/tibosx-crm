type TechBubbleLogoProps = {
  className?: string;
  compact?: boolean;
  /** `sidebar` = horizontal mark + wordmark for the dashboard nav; `stacked` = icon above text (login, etc.) */
  variant?: "stacked" | "sidebar";
};

const STACKED_LOGO = {
  src: "/techbubble-logo.png",
  width: 93,
  height: 40,
};

const SIDEBAR_LOGO = {
  src: "/techbubble-logo-sidebar.png",
  width: 132,
  height: 36,
};

/** Official TechBubble logo PNGs. */
export function TechBubbleLogo({
  className = "",
  compact = false,
  variant = "stacked",
}: TechBubbleLogoProps) {
  const useSidebarLogo = variant === "sidebar" && !compact;
  const asset = useSidebarLogo ? SIDEBAR_LOGO : STACKED_LOGO;
  const heightClass = compact ? "h-8" : useSidebarLogo ? "h-9" : "h-10";

  return (
    <span className={`inline-flex min-w-0 items-center ${className}`}>
      <img
        src={asset.src}
        alt="TechBubble"
        width={asset.width}
        height={asset.height}
        className={`w-auto max-w-full ${heightClass} dark:brightness-0 dark:invert`}
        decoding="async"
      />
    </span>
  );
}
