"use client";

import Link from "next/link";
import {
  BarChart3,
  Briefcase,
  Home,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
} from "lucide-react";

type NavLink = {
  href: string;
  label: string;
  icon?: typeof Home;
  child?: boolean;
};

type Props = {
  homeHref: string;
  homeActive: boolean;
  pathname: string;
  showSales: boolean;
  showDelivery: boolean;
  showSupport: boolean;
  showRecruitment: boolean;
  showReports: boolean;
  showSettings: boolean;
};

function pathUnder(base: string, pathname: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  child,
}: {
  href: string;
  label: string;
  icon?: typeof Home;
  active?: boolean;
  child?: boolean;
}) {
  if (child) {
    return (
      <Link
        href={href}
        className={`ml-[22px] flex items-center gap-2 rounded-[10px] border-l border-zinc-200 px-3 py-[7px] text-sm dark:border-zinc-700 ${
          active
            ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        }`}
      >
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-[10px] px-3 py-[9px] text-sm ${
        active
          ? "bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "font-medium text-zinc-900 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} /> : null}
      <span>{label}</span>
    </Link>
  );
}

/**
 * Sidebar from TIBOSX CRM Screens – 1 Home (widgets):
 * TB mark + TIBOSX · Home · Sales(+children) · Delivery · Support · Recruitment · Reports · Settings
 */
export function TibosxSidebar({
  homeHref,
  homeActive,
  pathname,
  showSales,
  showDelivery,
  showSupport,
  showRecruitment,
  showReports,
  showSettings,
}: Props) {
  const salesChildren: NavLink[] = [
    { href: "/clients/active", label: "Clients", child: true },
    { href: "/leads", label: "Engagement", child: true },
    { href: "/opportunities", label: "Planning", child: true },
  ];

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-[18px] dark:border-zinc-700 dark:bg-gray-900">
      <div className="mb-1 flex items-center gap-2.5 px-2 pb-4 pt-1">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-zinc-900 text-[11px] font-bold text-zinc-900 dark:border-zinc-100 dark:text-zinc-100">
          TB
        </span>
        <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">TIBOSX</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main">
        <NavItem href={homeHref} label="Home" icon={Home} active={homeActive} />

        {showSales ? (
          <>
            <NavItem
              href="/sales/dashboard"
              label="Sales"
              icon={TrendingUp}
              active={pathUnder("/sales/dashboard", pathname)}
            />
            {salesChildren.map((item) => {
              const active =
                item.label === "Clients"
                  ? pathUnder("/clients", pathname)
                  : item.label === "Engagement"
                    ? pathUnder("/leads", pathname)
                    : pathUnder("/opportunities", pathname);
              return (
                <NavItem key={item.href} href={item.href} label={item.label} child active={active} />
              );
            })}
          </>
        ) : null}

        {showDelivery ? (
          <NavItem
            href="/projects"
            label="Delivery"
            icon={Briefcase}
            active={pathUnder("/projects", pathname) || pathUnder("/timesheets", pathname)}
          />
        ) : null}

        {showSupport ? (
          <NavItem
            href="/support-tickets"
            label="Support"
            icon={Target}
            active={pathUnder("/support-tickets", pathname)}
          />
        ) : null}

        {showRecruitment ? (
          <NavItem
            href="/jobs/active"
            label="Recruitment"
            icon={UserPlus}
            active={pathUnder("/jobs", pathname) || pathUnder("/applications", pathname)}
          />
        ) : null}

        {showReports ? (
          <NavItem
            href="/sales/reports"
            label="Reports"
            icon={BarChart3}
            active={pathUnder("/sales/reports", pathname) || pathUnder("/reports", pathname)}
          />
        ) : null}

        <div className="mt-auto pt-4">
          {showSettings ? (
            <NavItem
              href="/settings/crm/workspace"
              label="Settings"
              icon={Sparkles}
              active={pathUnder("/settings", pathname)}
            />
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
