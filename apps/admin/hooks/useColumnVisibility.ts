"use client";

import { useCallback, useEffect, useState } from "react";

export type ListColumnDef = { id: string; label: string };

function readStoredColumnIds(storageKey: string, fallback: string[]): string[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    const allowed = new Set(fallback);
    const filtered = parsed.filter((id) => allowed.has(id));
    return filtered.length > 0 ? filtered : fallback;
  } catch {
    return fallback;
  }
}

export function useColumnVisibility(storageKey: string, columns: ListColumnDef[]) {
  const allIds = columns.map((c) => c.id);
  const [visibleIds, setVisibleIdsState] = useState<string[]>(() => readStoredColumnIds(storageKey, allIds));

  useEffect(() => {
    setVisibleIdsState(readStoredColumnIds(storageKey, allIds));
  }, [storageKey, allIds.join("|")]);

  const setVisibleIds = useCallback(
    (next: string[]) => {
      const allowed = new Set(allIds);
      const filtered = next.filter((id) => allowed.has(id));
      const resolved = filtered.length > 0 ? filtered : allIds;
      setVisibleIdsState(resolved);
      try {
        localStorage.setItem(storageKey, JSON.stringify(resolved));
      } catch {
        // ignore
      }
    },
    [allIds, storageKey],
  );

  const isVisible = useCallback((id: string) => visibleIds.includes(id), [visibleIds]);

  const toggleColumn = useCallback(
    (id: string) => {
      if (visibleIds.includes(id)) {
        if (visibleIds.length <= 1) return;
        setVisibleIds(visibleIds.filter((x) => x !== id));
      } else {
        setVisibleIds([...visibleIds, id]);
      }
    },
    [visibleIds, setVisibleIds],
  );

  return { columns, visibleIds, isVisible, setVisibleIds, toggleColumn };
}
