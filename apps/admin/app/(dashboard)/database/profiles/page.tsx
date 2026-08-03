"use client";

import { Upload, Search } from "lucide-react";

export default function ProfilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Search candidate profiles, bulk import, and manage the talent database.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          <Upload className="h-4 w-4" aria-hidden />
          Bulk import
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
        <input
          type="search"
          placeholder="AI search — name, skills, technology, location…"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Profile records</h2>
        </div>
        <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          No profile records yet. Profiles will be created from career applications (coming soon).
        </div>
      </div>
    </div>
  );
}
