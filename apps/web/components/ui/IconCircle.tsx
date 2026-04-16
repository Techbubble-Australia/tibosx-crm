import type { ComponentType } from "react";

type IconCircleProps = {
  icon: ComponentType<{ className?: string }>;
  className?: string;
  iconClassName?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-9 w-9 [&>svg]:h-4 [&>svg]:w-4",
  md: "h-10 w-10 [&>svg]:h-5 [&>svg]:w-5",
  lg: "h-12 w-12 [&>svg]:h-6 [&>svg]:w-6",
};

/** Rounded container with centered icon — consistent alignment across cards and lists. */
export function IconCircle({ icon: Icon, className = "", iconClassName = "", size = "md" }: IconCircleProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm [&>svg]:stroke-[1.5] ${sizeClasses[size]} ${className}`}
      aria-hidden
    >
      <Icon className={iconClassName} />
    </span>
  );
}
