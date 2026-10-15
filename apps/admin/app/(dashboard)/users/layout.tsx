"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminOnlyGuard } from "@/components/AdminOnlyGuard";
import { usersListTabFromPath } from "@/lib/user-routes";

function UsersTabs() {
  const pathname = usePathname();
  const selectedTab = usersListTabFromPath(pathname);
  const tabs = [
    { href: "/users/active", id: "active" as const, label: "Active" },
    { href: "/users/inactive", id: "inactive" as const, label: "Inactive" },
  ];
  const showTabs = pathname === "/users/active" || pathname === "/users/inactive";

  if (!showTabs) return null;

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
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
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminOnlyGuard>
      <UsersTabs />
      {children}
    </AdminOnlyGuard>
  );
}
