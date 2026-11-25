"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { opportunitiesNavTabFromPath } from "@/lib/opportunity-routes";

type Props = {
  title?: string;
  summary?: string;
  children: React.ReactNode;
  /** Extra controls on the filter row (left of Board/List/Forecast). */
  filters?: React.ReactNode;
  /** Hide Import / + Opportunity (e.g. detail pages use layout without shell). */
  showActions?: boolean;
};

const tabs = [
  { href: "/opportunities", id: "board" as const, label: "Board" },
  { href: "/opportunities/list", id: "list" as const, label: "List" },
  { href: "/opportunities/forecast", id: "forecast" as const, label: "Forecast" },
];

/**
 * Wireframe Opportunities chrome: title + pipeline summary, Import / + Opportunity,
 * then filter row with Board | List | Forecast segmented control on the right.
 */
export function OpportunitiesShell({
  title = "Opportunities",
  summary,
  children,
  filters,
  showActions = true,
}: Props) {
  const pathname = usePathname() ?? "";
  const selectedTab = opportunitiesNavTabFromPath(pathname);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
          {summary ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{summary}</p>
          ) : null}
        </div>
        {showActions ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/settings/crm/import-export?entity=opportunities"
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              Import
            </Link>
            <Link
              href="/opportunities/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              <Plus className="h-4 w-4" />
              Opportunity
            </Link>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">{filters}</div>
        <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
          {tabs.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-950 text-white dark:bg-white dark:text-black"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
