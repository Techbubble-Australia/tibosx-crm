"use client";

import { useEffect, useState } from "react";
import { normalizeAppEnv } from "@/lib/app-env";

function isDebugToolsEnvValue(value: string | undefined): boolean {
  const env = normalizeAppEnv(value);
  return env === "development" || env === "staging";
}

export function useIsDebugToolsAppEnv(): boolean {
  const [enabled, setEnabled] = useState(() =>
    isDebugToolsEnvValue(process.env.NEXT_PUBLIC_TBOS_ENV ?? process.env.NEXT_PUBLIC_ENV),
  );

  useEffect(() => {
    if (enabled) return;
    void fetch("/api/app-env", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { env?: string }) => {
        if (isDebugToolsEnvValue(data.env)) setEnabled(true);
      })
      .catch(() => undefined);
  }, [enabled]);

  return enabled;
}
