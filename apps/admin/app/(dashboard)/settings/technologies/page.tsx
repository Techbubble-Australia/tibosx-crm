"use client";

import { TechnologyTaxonomyManager } from "@/components/TechnologyTaxonomyManager";

export default function SettingsTechnologiesPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Technologies</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Used on job listings and case studies. Each technology must be linked to a category.
        </p>
      </div>
      <TechnologyTaxonomyManager />
    </div>
  );
}
