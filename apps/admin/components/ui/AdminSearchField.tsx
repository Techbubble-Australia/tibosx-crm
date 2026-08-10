"use client";

import { Search } from "lucide-react";

type AdminSearchFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filteredCount?: number;
  totalCount?: number;
};

export function AdminSearchField({
  id,
  value,
  onChange,
  placeholder = "Search…",
  filteredCount,
  totalCount,
}: AdminSearchFieldProps) {
  const showCount =
    value.trim().length > 0 &&
    typeof filteredCount === "number" &&
    typeof totalCount === "number";

  return (
    <div className="mb-4">
      <label className="sr-only" htmlFor={id}>
        Search
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          aria-hidden
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-white"
        />
      </div>
      {showCount ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Showing {filteredCount} of {totalCount} results
        </p>
      ) : null}
    </div>
  );
}
