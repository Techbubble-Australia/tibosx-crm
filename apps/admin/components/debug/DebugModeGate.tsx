"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const DebugModeShell = dynamic(() => import("@/components/debug/DebugModeShell").then((m) => m.DebugModeShell), {
  ssr: false,
});

function isDevelopmentValue(value: string | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "development";
}

export function DebugModeGate() {
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
  return <DebugModeShell />;
}
