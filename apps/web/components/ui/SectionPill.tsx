import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionPillProps = {
    label: ReactNode;
    className?: string;
    tone?: "default" | "dark";
    textClassName?: string;
};

export function SectionPill({
    label,
    className,
    tone = "default",
    textClassName,
}: SectionPillProps) {
    const isDark = tone === "dark";

    return (
        <div
            className={cn(
                "inline-flex h-7 items-center gap-2 rounded-[24px] border px-3",
                isDark ? "border-[#e5e5e5] bg-[#111111]" : "border-[#e5e5e5] bg-[#f7f7f7]",
                className,
            )}
        >
            <span className={cn("inline-flex h-2 w-2 items-center justify-center", isDark ? "text-white" : "text-[#666666]")} aria-hidden>
                <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.35294 0C1.76471 1.29545 0.470588 4.00909 0 4.5L2.35294 9H7.45098L10 4.5L7.45098 0H2.35294Z" fill="#666666" />
                </svg>

            </span>
            <p className={cn("text-[12px] font-medium leading-4", isDark ? "text-white" : "text-[#666666]", textClassName)}>{label}</p>
        </div>
    );
}