"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { OpportunitiesBoard } from "@/components/opportunities/OpportunitiesBoard";

export default function OpportunitiesIndexPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Opportunities</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pipeline board — use Active / Inactive tabs for list views.
          </p>
        </div>
        <Link
          href="/opportunities/new"
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="h-4 w-4" />
          Add opportunity
        </Link>
      </div>
      <OpportunitiesBoard />
    </div>
  );
}
