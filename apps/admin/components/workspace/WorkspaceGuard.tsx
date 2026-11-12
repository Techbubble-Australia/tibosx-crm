"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { anyEffectiveRole, defaultLandingPath } from "@/lib/admin-roles";
import { useAdminSession } from "@/contexts/AdminSessionContext";

/** Admins may preview any client's Client workspace; the rest of /workspace is the client/support portal. */
const ADMIN_PREVIEW_PATHS = ["/workspace/client"];

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { role, additionalRoles, loading, sessionLoaded } = useAdminSession();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const adminPreview =
    anyEffectiveRole(role, additionalRoles, ["admin"]) &&
    ADMIN_PREVIEW_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const allowed = adminPreview || anyEffectiveRole(role, additionalRoles, ["client", "customer_support"]);

  useEffect(() => {
    if (sessionLoaded && !loading && !allowed) {
      router.replace(defaultLandingPath(role));
    }
  }, [allowed, loading, sessionLoaded, role, router]);

  if (loading || !sessionLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  if (!allowed) return null;

  return children;
}
