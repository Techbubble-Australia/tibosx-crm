"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CareerApplicationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/career-applications/active", id: "active", label: "Active" },
    { href: "/career-applications/inactive", id: "inactive", label: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
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
      {children}
    </div>
  );
}
