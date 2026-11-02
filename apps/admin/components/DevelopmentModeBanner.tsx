"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ReportedTicketsLink } from "@/components/ReportedTicketsLink";
import { adminFetch } from "@/lib/admin-api";

function isDevelopmentValue(value: string | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "development";
}

/** Debug portal SSO is admin-only (same rule as debug portal login). */
function canOpenDebugPortal(role: unknown, additionalRoles: unknown): boolean {
  if (role === "admin") return true;
  return Array.isArray(additionalRoles) && additionalRoles.includes("admin");
}

/** Shown when `ENV=development` (or `TBOS_ENV`) on the admin service. */
export function DevelopmentModeBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(() =>
    isDevelopmentValue(process.env.NEXT_PUBLIC_TBOS_ENV),
  );
  const [showReportedTickets, setShowReportedTickets] = useState(false);

  useEffect(() => {
    if (visible) return;
    void fetch("/api/app-env", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { env?: string }) => {
        if (data.env === "development") setVisible(true);
      })
      .catch(() => undefined);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setShowReportedTickets(false);
      return;
    }
    let cancelled = false;
    void adminFetch("/api/auth/me")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setShowReportedTickets(false);
          return;
        }
        const user = data?.data?.user;
        if (typeof user?.id !== "string" || !user.id) {
          setShowReportedTickets(false);
          return;
        }
        setShowReportedTickets(canOpenDebugPortal(user.role, user.additionalRoles));
      })
      .catch(() => {
        if (!cancelled) setShowReportedTickets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, pathname]);

  if (!visible) return null;

  return (
    <>
      <div
        role="status"
        className="fixed left-0 right-0 top-0 z-[200] border-b border-amber-600/40 bg-amber-400 px-3 py-1.5 dark:border-amber-500/30 dark:bg-amber-500"
      >
        <div className="mx-auto flex max-w-[120rem] flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 flex-1 text-center text-xs font-medium text-amber-950 sm:text-left dark:text-amber-950">
            Development mode — you are not on production. Changes here do not affect live TBOS data
            unless this environment points at a production database.
          </p>
          {showReportedTickets ? <ReportedTicketsLink variant="banner" /> : null}
        </div>
      </div>
      <div className="h-10 shrink-0 sm:h-[34px]" aria-hidden />
    </>
  );
}
