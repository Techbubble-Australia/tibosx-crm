"use client";

import { useEffect } from "react";

const RELOAD_KEY = "tbos-chunk-reload-once";

function isChunkLoadFailure(message: string): boolean {
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(message);
}

/** One-time auto-reload when a stale deploy leaves the browser with missing JS chunks. */
export function ChunkLoadRecovery() {
  useEffect(() => {
    function maybeReload(message: string) {
      if (!isChunkLoadFailure(message)) return;
      try {
        if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
        sessionStorage.setItem(RELOAD_KEY, "1");
      } catch {
        // sessionStorage may be blocked; still try a single reload.
      }
      window.location.reload();
    }

    const onError = (event: ErrorEvent) => {
      maybeReload(event.message || String(event.error ?? ""));
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : String(reason ?? "");
      maybeReload(message);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
