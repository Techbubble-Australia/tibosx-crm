import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
  /** Renders as an accordion (closed unless `defaultOpen`). */
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function SectionCard({ title, children, className = "", collapsible = false, defaultOpen = false }: Props) {
  if (collapsible) {
    return (
      <details className={`dp-card group ${className}`} open={defaultOpen || undefined}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-5 hover:bg-slate-50 sm:p-6 [&::-webkit-details-marker]:hidden">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <ChevronDown
            className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
      </details>
    );
  }
  return (
    <section className={`dp-card p-5 sm:p-6 ${className}`}>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
