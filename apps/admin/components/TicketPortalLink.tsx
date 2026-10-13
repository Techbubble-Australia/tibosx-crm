"use client";

import { LifeBuoy } from "lucide-react";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { getEffectiveRoles } from "@/lib/admin-roles";

export function TicketPortalLink() {
  const { role, additionalRoles } = useAdminSession();
  const effective = getEffectiveRoles(role, additionalRoles);
  const isCustomerSupportOnly =
    effective.includes("customer_support") &&
    !effective.some((r) => r === "admin" || r === "sales");
  if (!isCustomerSupportOnly) return null;

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
