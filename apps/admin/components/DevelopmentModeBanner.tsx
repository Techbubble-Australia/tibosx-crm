"use client";

import { useEffect, useState } from "react";
import { ReportedTicketsLink } from "@/components/ReportedTicketsLink";

function isDevelopmentValue(value: string | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "development";
}

/** Shown when `ENV=development` (or `TBOS_ENV`) on the admin service. */
export function DevelopmentModeBanner() {
  const [visible, setVisible] = useState(() =>
    isDevelopmentValue(process.env.NEXT_PUBLIC_TBOS_ENV),
  );

  useEffect(() => {
    if (visible) return;
    void fetch("/api/app-env", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { env?: string }) => {
        if (data.env === "development") setVisible(true);
      })
      .catch(() => undefined);
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <div
        role="status"
        className="fixed left-0 right-0 top-0 z-[200] flex items-center justify-center gap-3 border-b border-amber-600/40 bg-amber-400 px-3 py-1.5 text-xs font-medium text-amber-950 dark:border-amber-500/30 dark:bg-amber-500 dark:text-amber-950"
      >
        <span className="text-center">
          Development mode — you are not on production. Changes here do not affect live TBOS data
          unless this environment points at a production database.
        </span>
        <ReportedTicketsLink />
      </div>
      <div className="h-[34px] shrink-0" aria-hidden />
    </>
  );
}
