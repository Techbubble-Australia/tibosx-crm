"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { useAdminSession } from "@/contexts/AdminSessionContext";

export function ProfileHeaderLink() {
  const { loading, userName, email } = useAdminSession();
  if (loading) return null;

  const label = userName || email || "Your profile";

  return (
    <Link
      href="/settings/profile"
      className="inline-flex max-w-[220px] items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
      title="View your user record"
    >
      <Info className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}
