"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { anyEffectiveRole, defaultLandingPath } from "@/lib/admin-roles";
import { useAdminSession } from "@/contexts/AdminSessionContext";

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { role, additionalRoles, loading } = useAdminSession();
  const router = useRouter();
  const allowed = anyEffectiveRole(role, additionalRoles, ["client", "customer_support"]);

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace(defaultLandingPath(role));
    }
  }, [allowed, loading, role, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  if (!allowed) return null;

  return children;
}
