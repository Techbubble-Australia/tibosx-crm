"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";
import { MyDayPanel } from "@/components/sales/MyDayPanel";

export default function MyDayPage() {
  return (
    <ClientsOnlyGuard>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/my-workspace"
              className="mt-0.5 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My day</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Due and overdue next steps, new leads, closings this month, and contracts needing attention.
              </p>
            </div>
          </div>
          <Link
            href="/leads"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Open leads
          </Link>
        </div>
        <MyDayPanel variant="full" />
      </div>
    </ClientsOnlyGuard>
  );
}
