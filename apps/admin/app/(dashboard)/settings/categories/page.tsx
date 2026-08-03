"use client";

import { TaxonomyManager } from "@/components/TaxonomyManager";

export default function SettingsCategoriesPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Categories</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Used on job listings and case studies (e.g. ServiceNow, Salesforce, Microsoft).
        </p>
      </div>
      <TaxonomyManager
        apiPath="/api/admin/job-categories"
        title="Categories"
        description="Manage category options for jobs and case studies."
      />
    </div>
  );
}
