"use client";

import { useEffect, useState } from "react";

export type PortalUser = { id: string; email: string; name: string; role: string; isAdmin: boolean };

export function usePortalUser() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/debug-portal/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setUser((json?.data?.user as PortalUser | undefined) ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, isAdmin: Boolean(user?.isAdmin) };
}
