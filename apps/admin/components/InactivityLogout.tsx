"use client";

import { useEffect } from "react";
import { ADMIN_INACTIVITY_MS } from "@/lib/session";

export function InactivityLogout() {
  useEffect(() => {
    let timer = window.setTimeout(() => {
      void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
        window.location.href = "/login";
      });
    }, ADMIN_INACTIVITY_MS);

    let refreshTimer: number | undefined;

    function refreshSession() {
      void fetch("/api/auth/session", { method: "GET", credentials: "include" });
    }

    function resetTimer() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
          window.location.href = "/login";
        });
      }, ADMIN_INACTIVITY_MS);

      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refreshSession, 60_000);
    }

    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    for (const event of events) {
      window.addEventListener(event, resetTimer, { passive: true });
    }
    resetTimer();

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(refreshTimer);
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, []);

  return null;
}
