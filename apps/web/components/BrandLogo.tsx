type BrandLogoProps = {
  /** Light background → black logo; dark background → inverted to white */
  variant: "onLight" | "onDark";
  className?: string;
  priority?: boolean;
};

const LOGO_SRC = "/techbubble-logo.png";
const LOGO_WIDTH = 93;
const LOGO_HEIGHT = 40;

/** Official TechBubble logo (hexagon mark + wordmark PNG). */
export function BrandLogo({ variant, className = "", priority = false }: BrandLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="TechBubble"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className={`h-10 w-auto sm:h-11 ${variant === "onDark" ? "brightness-0 invert" : ""} ${className}`}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
