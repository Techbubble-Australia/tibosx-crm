"use client";

import Link from "next/link";

/** Shared chrome bits matching TIBOSX CRM Screens (Sales family). */

export function CrmPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CrmGhostButton({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className}>
      {children}
    </button>
  );
}

export function CrmPrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {children}
    </Link>
  );
}

export function CrmSegmentTabs({
  tabs,
  activeId,
}: {
  tabs: Array<{ id: string; label: string; href: string }>;
  activeId: string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-gray-900">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function CrmKpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="min-w-[160px] flex-1 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-gray-900">
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1.5 text-[28px] font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
    </div>
  );
}

export function CrmFilterSelect({
  value,
  onChange,
  children,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-gray-900 dark:text-zinc-100"
    >
      {children}
    </select>
  );
}

export function moneyUsdStyle(amount: number) {
  return `$${Math.round(amount || 0).toLocaleString("en-AU")}`;
}
