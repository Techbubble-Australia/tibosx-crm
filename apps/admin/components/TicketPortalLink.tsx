"use client";

import { LifeBuoy } from "lucide-react";
import { useAdminSession } from "@/contexts/AdminSessionContext";

const CONSULTANT_ROLES = new Set(
  (process.env.NEXT_PUBLIC_TICKETING_TBOS_CONSULTANT_ROLES || "admin,sales").split(",").map((r) => r.trim()),
);

export function TicketPortalLink() {
  const { role } = useAdminSession();
  if (!CONSULTANT_ROLES.has(role)) return null;

  return (
    <a
      href="/api/ticketing/launch"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      <LifeBuoy className="h-4 w-4" />
      Support portal
    </a>
  );
}
