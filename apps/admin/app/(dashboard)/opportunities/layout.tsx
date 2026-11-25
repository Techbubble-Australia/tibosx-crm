"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import { opportunitiesNavTabFromPath } from "@/lib/opportunity-routes";

function OpportunitiesTabsInner() {
  const pathname = usePathname();
  const selectedTab = opportunitiesNavTabFromPath(pathname);

  const tabs = [
    { href: "/opportunities", id: "board" as const, label: "Board" },
    { href: "/opportunities/list", id: "list" as const, label: "List" },
    { href: "/opportunities/forecast", id: "forecast" as const, label: "Forecast" },
  ];

  const showTabs =
    pathname === "/opportunities" ||
    pathname === "/opportunities/" ||
    pathname === "/opportunities/list" ||
    pathname === "/opportunities/forecast" ||
    pathname === "/opportunities/active" ||
    pathname === "/opportunities/inactive";

  if (!showTabs) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => {
        const active = selectedTab === tab.id;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-black text-gray-900 dark:border-white dark:text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
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

export default function OpportunitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
              <span className="px-4 py-2 text-sm text-gray-400">Board</span>
              <span className="px-4 py-2 text-sm text-gray-400">List</span>
              <span className="px-4 py-2 text-sm text-gray-400">Forecast</span>
            </div>
          }
        >
          <OpportunitiesTabsInner />
        </Suspense>
        {children}
      </div>
    </ClientsOnlyGuard>
  );
}
