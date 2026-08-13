import { Flame } from "lucide-react";

type JobHotBadgeProps = {
  isHot?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function JobHotBadge({ isHot, size = "md", className = "" }: JobHotBadgeProps) {
  if (!isHot) return null;

  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span
      className={`inline-flex shrink-0 items-center ${className}`}
      title="Hot role"
      aria-label="Hot role"
    >
      <Flame className={`${iconClass} fill-orange-500 text-orange-500`} aria-hidden />
    </span>
  );
}
