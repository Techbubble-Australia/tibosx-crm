"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home } from "lucide-react";

type Props = {
  showPersonal: boolean;
  showClient: boolean;
};

/** Personal / Client workspace toggle in the top-right header. */
export function WorkspaceSwitcher({ showPersonal, showClient }: Props) {
  const pathname = usePathname() ?? "";
  if (!showPersonal && !showClient) return null;

  const personalActive = pathname === "/my-workspace" || pathname.startsWith("/my-workspace/");
  const clientActive = pathname === "/workspace/client" || pathname.startsWith("/workspace/client/");

  return (
    <div
      className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
      role="group"
      aria-label="Workspace"
    >
      {showPersonal ? (
        <Link
          href="/my-workspace"
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            personalActive
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <Home className="h-3.5 w-3.5" aria-hidden />
          Personal
        </Link>
      ) : null}
      {showClient ? (
        <Link
          href="/workspace/client"
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            clientActive
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" aria-hidden />
          Client
        </Link>
      ) : null}
    </div>
  );
}
