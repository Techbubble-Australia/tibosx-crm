import Image from "next/image";

type BrandLogoProps = {
  /** Light background → black logo; dark background → inverted to white */
  variant: "onLight" | "onDark";
  className?: string;
  priority?: boolean;
};

/** Official TechBubble logo. */
export function BrandLogo({ variant, className = "", priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/techbubble-logo.png"
      alt="TechBubble"
      width={93}
      height={40}
      sizes="(max-width: 768px) 120px, 160px"
      className={`h-10 w-auto sm:h-11 ${variant === "onDark" ? "brightness-0 invert" : ""} ${className}`}
      priority={priority}
    />
  );
}
