"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { opportunitiesNavTabFromPath } from "@/lib/opportunity-routes";
import { OpportunitiesWhatChanged } from "@/components/opportunities/OpportunitiesWhatChanged";

type Props = {
  title?: string;
  summary?: string;
  children: React.ReactNode;
  /** Full-width filter row under the Board/List/Forecast switcher. */
  filters?: React.ReactNode;
  showActions?: boolean;
};

const tabs = [
  { href: "/opportunities", id: "board" as const, label: "Board" },
  { href: "/opportunities/list", id: "list" as const, label: "List" },
  { href: "/opportunities/forecast", id: "forecast" as const, label: "Forecast" },
];

/**
 * Wireframe Opportunities chrome (PDF p4 / attached board mock):
 * 1) Title + summary | Import + Opportunity
 * 2) Board | List | Forecast aligned under the action buttons (right)
 * 3) Filter dropdowns full-width row
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
  const showWhatChanged = selectedTab === "board";

  const tabControl = (
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
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">{title}</h1>
          {summary ? <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{summary}</p> : null}
        </div>
        {showActions ? (
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href="/settings/crm/import-export?entity=opportunities"
                className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                Import
              </Link>
              <Link
                href="/opportunities/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
                Opportunity
              </Link>
            </div>
            {tabControl}
          </div>
        ) : (
          <div className="flex justify-end">{tabControl}</div>
        )}
      </div>

      {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}

      {children}

      {showWhatChanged ? (
        <div className="pt-2">
          <OpportunitiesWhatChanged />
        </div>
      ) : null}
    </div>
  );
}
