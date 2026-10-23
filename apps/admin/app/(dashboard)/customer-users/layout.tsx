"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function CustomerUsersTabs() {
  const pathname = usePathname();
  const tabs = [
    { href: "/customer-users/active", id: "active" as const, label: "Active" },
    { href: "/customer-users/inactive", id: "inactive" as const, label: "Inactive" },
  ];
  const showTabs = pathname === "/customer-users/active" || pathname === "/customer-users/inactive";
  if (!showTabs) return null;
  return (
    <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              active
                ? "border-black text-gray-900 dark:border-white dark:text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function CustomerUsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CustomerUsersTabs />
      {children}
    </div>
  );
}
