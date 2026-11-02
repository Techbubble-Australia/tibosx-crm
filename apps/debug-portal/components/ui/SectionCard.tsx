import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, children, className = "" }: Props) {
  return (
    <section className={`dp-card p-5 sm:p-6 ${className}`}>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
