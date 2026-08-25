"use client";

import { TaxonomyManager } from "@/components/TaxonomyManager";

export default function SettingsLevelsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Levels</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Used on job listings and candidate profiles (e.g. Developer, Architect).
        </p>
      </div>
      <TaxonomyManager
        apiPath="/api/admin/job-levels"
        title="Levels"
        description="Manage level options for jobs and profiles."
      />
    </div>
  );
}
