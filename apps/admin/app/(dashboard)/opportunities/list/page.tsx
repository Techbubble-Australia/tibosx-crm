"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { OpportunitiesListPage } from "@/components/opportunities/OpportunitiesListPage";

export default function OpportunitiesListRoutePage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Opportunities</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">List view of open and closed deals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings/crm/import-export?entity=opportunities"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          >
            <Upload className="h-4 w-4" />
            Import
          </Link>
          <Link
            href="/opportunities/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" />
            Opportunity
          </Link>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
          </div>
        }
      >
        <OpportunitiesListPage />
      </Suspense>
    </div>
  );
}
