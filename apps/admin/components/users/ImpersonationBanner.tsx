"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useState } from "react";
import { useAdminSession } from "@/contexts/AdminSessionContext";

export function ImpersonationBanner() {
  const { impersonation, refreshSession } = useAdminSession();
  const [ending, setEnding] = useState(false);
  if (!impersonation) return null;

  async function endImpersonation() {
    setEnding(true);
    try {
      const res = await fetch("/api/auth/impersonate/end", { method: "POST", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Failed");
      }
      await refreshSession();
      window.location.href = "/my-workspace";
    } catch (e) {
      appAlert(e instanceof Error ? e.message : "Could not end impersonation");
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          You are viewing TIBOSX as another user. Signed in as admin:{" "}
          <span className="font-medium">{impersonation.impersonatorName}</span>
        </p>
        <button
          type="button"
          disabled={ending}
          onClick={() => void endImpersonation()}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-gray-900"
        >
          End impersonation
        </button>
      </div>
    </div>
  );
}
