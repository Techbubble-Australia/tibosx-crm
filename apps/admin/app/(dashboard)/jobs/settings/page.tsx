"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TaxonomyManager } from "@/components/TaxonomyManager";

export default function JobSettingsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/jobs" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Job Listing Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage job categories and departments used in job listing forms.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <TaxonomyManager
          apiPath="/api/admin/job-categories"
          title="Job Categories"
          description="Shown above Department on the job form (e.g. Platform Consulting, Development)."
        />
        <TaxonomyManager
          apiPath="/api/admin/job-departments"
          title="Departments"
          description="Department options for job listings (e.g. Engineering, Consulting)."
        />
      </div>
    </div>
  );
}
