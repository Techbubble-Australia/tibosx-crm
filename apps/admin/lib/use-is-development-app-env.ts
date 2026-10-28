"use client";

import { useEffect, useState } from "react";

export function useIsDevelopmentAppEnv(): boolean {
  const [visible, setVisible] = useState(() =>
    (process.env.NEXT_PUBLIC_TBOS_ENV ?? "").trim().toLowerCase() === "development",
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

  return visible;
}
