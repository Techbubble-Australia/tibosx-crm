"use client";

import { Bell } from "lucide-react";
import { TenantWorkspaceMenu } from "@/components/TenantWorkspaceMenu";

type Props = {
  firstName: string;
  email: string;
  notificationCount?: number;
  showPersonalHome?: boolean;
  personalHomeHref?: string;
  showClientHome?: boolean;
  onSignOut: () => void;
};

/** Header from TIBOSX CRM Screens – 1 Home (widgets). */
export function TibosxHeader({
  firstName,
  email,
  notificationCount = 0,
  showPersonalHome,
  personalHomeHref,
  showClientHome,
  onSignOut,
}: Props) {
  return (
    <header className="flex flex-wrap items-center gap-3 bg-[#fafafa] px-7 py-4 dark:bg-gray-950">
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Welcome back, {firstName || "there"}
      </span>
      <TenantWorkspaceMenu
        variant="pill"
        showPersonalHome={showPersonalHome}
        personalHomeHref={personalHomeHref}
        showClientHome={showClientHome}
      />
      <span className="min-w-0 flex-1" />
      <span className="relative inline-flex text-zinc-900 dark:text-zinc-100" aria-label="Notifications">
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        {notificationCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 px-1.5 py-px text-[10px] font-medium leading-none text-white">
            {notificationCount}
          </span>
        ) : null}
      </span>
      <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{email}</span>
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-3.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Log out
      </button>
    </header>
  );
}
