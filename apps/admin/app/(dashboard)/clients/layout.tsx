"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

const tabs = [
  { href: "/clients/active", label: "Active" },
  { href: "/clients/prospect", label: "Prospect" },
  { href: "/clients/inactive", label: "Inactive" },
];

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showTabs = tabs.some((tab) => pathname === tab.href);

  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        {showTabs ? (
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
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
    </ClientsOnlyGuard>
  );
}
