"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export type SortDir = "asc" | "desc";

type Props<T extends string> = {
  label: string;
  sortKey: T;
  activeKey: T;
  dir: SortDir;
  onSort: (key: T) => void;
  className?: string;
};

export function SortableTh<T extends string>({ label, sortKey, activeKey, dir, onSort, className }: Props<T>) {
  const active = activeKey === sortKey;
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
      >
        {label}
        {active ? (
          dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </th>
  );
}

export function toggleSortKey<T extends string>(
  key: T,
  activeKey: T,
  dir: SortDir,
): { key: T; dir: SortDir } {
  if (activeKey === key) return { key, dir: dir === "asc" ? "desc" : "asc" };
  return { key, dir: "asc" };
}
