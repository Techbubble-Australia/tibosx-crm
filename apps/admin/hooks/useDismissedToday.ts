"use client";

import { useCallback, useEffect, useState } from "react";

type Stored = { date: string; ids: string[] };

function localDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Notification ids hidden for the rest of the local day; they come back tomorrow if still outstanding. */
export function useDismissedToday(scope: string, userId: string | null | undefined) {
  const storageKey = `tibosx:dismissed:${scope}:${userId || "anon"}`;
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as Stored) : null;
      setIds(new Set(parsed?.date === localDateKey() ? parsed.ids : []));
    } catch {
      setIds(new Set());
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: Set<string>) => {
      setIds(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ date: localDateKey(), ids: [...next] } satisfies Stored));
      } catch {
        /* storage unavailable: dismissal lasts for this page view only */
      }
    },
    [storageKey],
  );

  const dismiss = useCallback((id: string) => persist(new Set([...ids, id])), [ids, persist]);
  const restoreAll = useCallback(() => persist(new Set()), [persist]);

  return { dismissed: ids, dismiss, restoreAll };
}
