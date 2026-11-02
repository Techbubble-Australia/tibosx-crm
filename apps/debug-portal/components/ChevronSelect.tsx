"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function ChevronSelect({
  value,
  onChange,
  children,
  id,
  disabled,
  className = "",
  "aria-label": ariaLabel,
}: Props) {
  return (
    <div className={`relative inline-block min-w-[10.5rem] ${className}`}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
    </div>
  );
}
