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
    <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
      {tabs.map((tab) => {
        const active = selectedTab === tab.id;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
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
