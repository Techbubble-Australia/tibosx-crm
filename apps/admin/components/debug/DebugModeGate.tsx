"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAdminSession } from "@/contexts/AdminSessionContext";

const DebugModeShell = dynamic(() => import("@/components/debug/DebugModeShell").then((m) => m.DebugModeShell), {
  ssr: false,
});

function isDevelopmentValue(value: string | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "development";
}

/** Debug toolbar (debug on/off + reported tickets): development only, internal and admin users only. */
export function DebugModeGate() {
  const { role, loading } = useAdminSession();
  const [isDevEnv, setIsDevEnv] = useState(() => isDevelopmentValue(process.env.NEXT_PUBLIC_TBOS_ENV));

  useEffect(() => {
    if (isDevEnv) return;
    void fetch("/api/app-env", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { env?: string }) => {
        if (data.env === "development") setIsDevEnv(true);
      })
      .catch(() => undefined);
  }, [isDevEnv]);

  const isInternalUser = !loading && Boolean(role) && role !== "client";
  if (!isDevEnv || !isInternalUser) return null;
  return <DebugModeShell />;
}
