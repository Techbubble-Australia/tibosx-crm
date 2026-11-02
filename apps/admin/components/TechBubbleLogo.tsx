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

/** Square mark for collapsed sidebar (no horizontal wordmark squeeze). */
const SIDEBAR_ICON = {
  src: "/techbubble-logo.png",
  width: 40,
  height: 40,
};

/** Official TechBubble logo PNGs. */
export function TechBubbleLogo({
  className = "",
  compact = false,
  variant = "stacked",
  showProductLabel = false,
}: TechBubbleLogoProps) {
  if (compact) {
    return (
      <img
        src={SIDEBAR_ICON.src}
        alt="TechBubble"
        width={SIDEBAR_ICON.width}
        height={SIDEBAR_ICON.height}
        className={`size-9 shrink-0 object-contain dark:brightness-0 dark:invert ${className}`}
        decoding="async"
      />
    );
  }

  const useSidebarLogo = variant === "sidebar";
  const asset = useSidebarLogo ? SIDEBAR_LOGO : STACKED_LOGO;
  const heightClass = useSidebarLogo ? "h-7" : "h-10";

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-3 ${useSidebarLogo && showProductLabel ? "" : "gap-2"} ${className}`}
    >
      <img
        src={asset.src}
        alt="TechBubble"
        width={asset.width}
        height={asset.height}
        className={`w-auto max-w-[7.5rem] shrink-0 ${heightClass} dark:brightness-0 dark:invert`}
        decoding="async"
      />
      {showProductLabel ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[15px] font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100">
            TIBOSX
          </span>
          <span className="text-[10px] font-medium leading-snug text-gray-500 dark:text-gray-400">
            AI-powered Business Operating System
          </span>
        </span>
      ) : null}
    </span>
  );
}
