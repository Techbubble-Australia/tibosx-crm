import type { ReactNode } from "react";
import Link from "next/link";

export function LegalDocShell({
  title,
  lastUpdated = "27 April 2026",
  children,
}: {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <section className="bg-[#111111] pb-12 pt-24 text-white">
        <div className="tb-container">
          <nav className="mb-6 text-sm text-neutral-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2 text-neutral-600" aria-hidden>
              /
            </span>
            <span className="text-white">{title}</span>
          </nav>
          <h1 className="text-[40px] font-semibold leading-[48px] tracking-[-0.1px]">{title}</h1>
          <p className="mt-2 text-sm text-neutral-400">Last updated: {lastUpdated}</p>
        </div>
      </section>
      <section className="bg-white py-16 text-[#111111]">
        <div className="tb-container">
          <article className="mx-auto max-w-[720px] space-y-5 text-[16px] leading-7 text-[#444444]">{children}</article>
        </div>
      </section>
    </>
  );
}

export function LegalHeading({ children }: { children: ReactNode }) {
  return <h2 className="pt-4 text-[22px] font-bold leading-8 tracking-[-0.02em] text-[#111111]">{children}</h2>;
}
