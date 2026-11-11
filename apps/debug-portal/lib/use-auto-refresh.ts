"use client";

import { useEffect, useRef } from "react";

export const AUTO_REFRESH_MS = 15_000;

/**
 * Calls `refresh` every `intervalMs` while the tab is visible, and immediately when the user
 * comes back to the tab. `paused` skips refreshes (e.g. while dragging or editing).
 */
export function useAutoRefresh(refresh: () => void, { intervalMs = AUTO_REFRESH_MS, paused = false } = {}) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const run = () => {
      if (pausedRef.current || document.visibilityState !== "visible") return;
      refreshRef.current();
    };
    const timer = window.setInterval(run, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", run);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", run);
    };
  }, [intervalMs]);
}
