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

    function resetTimer() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void fetch("/api/auth/logout", { method: "POST", credentials: "include" }).finally(() => {
          window.location.href = "/login";
        });
      }, ADMIN_INACTIVITY_MS);
    }

    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    for (const event of events) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      window.clearTimeout(timer);
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, []);

  return null;
}
