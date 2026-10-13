"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultLandingPath } from "@/lib/admin-roles";
import { useAdminSession } from "@/contexts/AdminSessionContext";

export function ClientsOnlyGuard({ children }: { children: React.ReactNode }) {
  const { canManageClients, loading, role } = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !canManageClients) {
      router.replace(defaultLandingPath(role));
    }
  }, [canManageClients, loading, role, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  if (!canManageClients) {
    return null;
  }

  return children;
}
