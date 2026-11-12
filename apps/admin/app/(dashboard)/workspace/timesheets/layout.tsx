"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function WorkspaceTimesheetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isDetailPage =
    pathname.startsWith("/workspace/timesheets/") &&
    pathname !== "/workspace/timesheets/submitted" &&
    pathname !== "/workspace/timesheets/approved";
  const tabs = [
    { href: "/workspace/timesheets/submitted", id: "submitted", label: "Submitted" },
    { href: "/workspace/timesheets/approved", id: "approved", label: "Approved" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Timesheets</h1>
        <p className="mt-1 text-sm text-slate-500">
          Team timesheets for your projects. Timesheet approvers can approve or reject submitted timesheets.
        </p>
      </div>

      {!isDetailPage ? (
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.id === "submitted" && pathname === "/workspace/timesheets");
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
      ) : null}

      {children}
    </div>
  );
}
