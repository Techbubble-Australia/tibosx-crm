"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/careers", label: "Careers" },
  { href: "/case-studies", label: "Case Studies" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDark = pathname === "/about";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-50 border-b shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] ${
        isDark ? "border-neutral-800 bg-black shadow-[0_4px_12px_-2px_rgba(0,0,0,0.45)]" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="tb-container">
        <div className="flex min-h-[4.25rem] items-center gap-4 py-2.5">
          <Link href="/" className="shrink-0">
            <BrandLogo variant={isDark ? "onDark" : "onLight"} priority />
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-8 md:flex lg:gap-10"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative inline-block pb-2.5 text-sm transition-colors ${
                    isDark
                      ? active
                        ? "font-semibold text-white"
                        : "font-medium text-neutral-400 hover:text-white"
                      : active
                        ? "font-semibold text-neutral-900"
                        : "font-medium text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {link.label}
                  {/* Slightly wider than label — reference extends past first/last letter */}
                  <span
                    className={`absolute bottom-0 left-1/2 h-[3px] w-[calc(100%+12px)] max-w-none -translate-x-1/2 rounded-full ${
                      active ? (isDark ? "bg-white opacity-100" : "bg-neutral-900 opacity-100") : "opacity-0"
                    }`}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <Link
              href="/contact"
              className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
                isDark
                  ? "border-neutral-500 text-white hover:border-neutral-300"
                  : "border-neutral-200 bg-transparent text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50/80"
              }`}
            >
              Contact
            </Link>
            <Link
              href="/contact"
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                isDark
                  ? "bg-white text-neutral-900 hover:bg-neutral-100"
                  : "bg-black text-white hover:bg-neutral-900"
              }`}
            >
              Get Started
              <ArrowRight
                className={`h-4 w-4 shrink-0 ${isDark ? "text-neutral-900" : "text-white"}`}
                strokeWidth={2}
                aria-hidden
              />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`ml-auto p-2 md:ml-0 md:hidden ${isDark ? "text-white" : "text-neutral-900"}`}
            aria-label="Open menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className={`border-t md:hidden ${isDark ? "border-neutral-800 bg-black" : "border-neutral-200 bg-white"}`}
        >
          <nav className="flex flex-col gap-0.5 px-4 py-4" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm ${
                    isDark
                      ? active
                        ? "font-semibold text-white"
                        : "font-medium text-neutral-400"
                      : active
                        ? "font-semibold text-neutral-900"
                        : "font-medium text-neutral-600"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white"
            >
              Get Started
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
