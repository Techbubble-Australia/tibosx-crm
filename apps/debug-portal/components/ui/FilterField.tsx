import type { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
};

export function FilterField({ label, htmlFor, children, className = "" }: Props) {
  return (
    <div className={`flex min-w-[8rem] flex-1 flex-col gap-1.5 sm:max-w-[16rem] ${className}`}>
      <label htmlFor={htmlFor} className="dp-filter-label">
        {label}
      </label>
      {children}
    </div>
  );
}
