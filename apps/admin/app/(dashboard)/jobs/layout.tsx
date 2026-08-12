"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { jobsNavTabFromPath } from "@/lib/job-routes";

function JobsTabsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTab = jobsNavTabFromPath(pathname, searchParams.get("tab"));

  const tabs = [
    { href: "/jobs/active", id: "active" as const, label: "Active" },
    { href: "/jobs/inactive", id: "inactive" as const, label: "Inactive" },
    { href: "/jobs/career-applications", id: "career-applications" as const, label: "Career Applications" },
  ];

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

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
            <span className="px-4 py-2 text-sm text-gray-400">Active</span>
            <span className="px-4 py-2 text-sm text-gray-400">Inactive</span>
            <span className="px-4 py-2 text-sm text-gray-400">Career Applications</span>
          </div>
        }
      >
        <JobsTabsInner />
      </Suspense>
      {children}
    </div>
  );
}
