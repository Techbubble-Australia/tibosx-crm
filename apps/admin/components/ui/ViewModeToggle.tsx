"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "list" | "card";

type ViewModeToggleProps = {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  listLabel?: string;
  cardLabel?: string;
};

export function ViewModeToggle({
  mode,
  onChange,
  listLabel = "List",
  cardLabel = "Card",
}: ViewModeToggleProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const active = "bg-black text-white dark:bg-white dark:text-black";
  const inactive =
    "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800";

  return (
    <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-600">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`${base} ${mode === "list" ? active : inactive}`}
        aria-pressed={mode === "list"}
      >
        <List className="h-4 w-4" aria-hidden />
        {listLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("card")}
        className={`${base} ${mode === "card" ? active : inactive}`}
        aria-pressed={mode === "card"}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        {cardLabel}
      </button>
    </div>
  );
}
