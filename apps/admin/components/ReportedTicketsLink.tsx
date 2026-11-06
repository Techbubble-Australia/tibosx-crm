"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Ticket } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { debugPortalPublicUrl } from "@/lib/debug-portal-url";

type Variant = "banner" | "sidebar" | "toolbar";

async function resolveDebugPortalBase(): Promise<string> {
  const inlined = debugPortalPublicUrl();
  if (inlined) return inlined;
  try {
    const res = await fetch("/api/app-env", { cache: "no-store" });
    const data = (await res.json()) as { debugPortalUrl?: string | null };
    if (typeof data.debugPortalUrl === "string" && data.debugPortalUrl.trim()) {
      return data.debugPortalUrl.trim().replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  return "";
}

export function ReportedTicketsLink({ variant = "banner" }: { variant?: Variant }) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    const base = await resolveDebugPortalBase();
    if (!base) {
      appAlert(
        "Debug portal URL is not configured. Set DEBUG_PORTAL_PUBLIC_URL (or NEXT_PUBLIC_DEBUG_PORTAL_URL at build) on the admin service.",
      );
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

  const bannerClass =
    "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-amber-900/30 bg-white/90 px-2.5 py-1 text-xs font-semibold text-amber-950 shadow-sm hover:bg-white disabled:opacity-60 dark:border-amber-950/40 dark:bg-amber-950/20 dark:text-amber-50 dark:hover:bg-amber-950/30";
  const sidebarClass =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100";
  const toolbarClass =
    "inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 shadow-lg hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800";

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void openPortal()}
      className={variant === "sidebar" ? sidebarClass : variant === "toolbar" ? toolbarClass : bannerClass}
      title="Open debug ticket portal (SSO)"
    >
      {loading ? (
        <Loader2 className={`animate-spin ${variant === "toolbar" ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
      ) : variant === "sidebar" ? (
        <Ticket className="h-3.5 w-3.5 shrink-0 opacity-70" />
      ) : variant === "toolbar" ? (
        <Ticket className="h-4 w-4" />
      ) : (
        <ExternalLink className="h-3.5 w-3.5" />
      )}
      Reported tickets
    </button>
  );
}
