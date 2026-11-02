"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { debugPortalPublicUrl } from "@/lib/debug-portal-url";

export function ReportedTicketsLink() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    const base = debugPortalPublicUrl();
    if (!base) {
      appAlert("Debug portal URL is not configured. Set NEXT_PUBLIC_DEBUG_PORTAL_URL on the admin service.");
      return;
    }

    setLoading(true);
    try {
      const res = await adminFetch("/api/debug-portal/auth/sso-from-tbos", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        appAlert(typeof data.error === "string" ? data.error : "Could not open debug portal");
        return;
      }

      const ssoToken = data?.data?.ssoToken;
      const reporterUserId = data?.data?.reporterUserId;
      if (typeof ssoToken !== "string") {
        appAlert("Invalid SSO response from server");
        return;
      }

      const url = new URL("/api/auth/sso", base);
      url.searchParams.set("token", ssoToken);
      if (typeof reporterUserId === "string" && reporterUserId) {
        url.searchParams.set("reporterUserId", reporterUserId);
      }
      window.location.assign(url.toString());
    } catch {
      appAlert("Could not open debug portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void openPortal()}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-amber-800/25 bg-amber-950/10 px-2.5 py-1 text-xs font-semibold text-amber-950 hover:bg-amber-950/15 disabled:opacity-60 dark:border-amber-950/20 dark:bg-amber-950/15 dark:hover:bg-amber-950/25"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
      Reported tickets
    </button>
  );
}
