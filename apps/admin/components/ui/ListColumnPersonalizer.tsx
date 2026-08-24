"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import type { ListColumnDef } from "@/hooks/useColumnVisibility";

export function ListColumnPersonalizer({
  columns,
  visibleIds,
  onToggle,
}: {
  columns: ListColumnDef[];
  visibleIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        aria-expanded={open}
        aria-label="Personalise list columns"
        title="Personalise columns"
      >
        <Settings2 className="h-4 w-4" aria-hidden />
        Columns
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Close column personaliser"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-900"
            role="dialog"
            aria-label="Choose visible columns"
          >
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Show columns</p>
            <ul className="space-y-1">
              {columns.map((col) => (
                <li key={col.id}>
                  <label className="flex items-center gap-2 rounded px-1 py-1 text-sm text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={visibleIds.includes(col.id)}
                      onChange={() => onToggle(col.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {col.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
