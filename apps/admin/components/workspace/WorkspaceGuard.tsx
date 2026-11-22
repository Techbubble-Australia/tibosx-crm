"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { anyEffectiveRole, defaultLandingPath, isRestrictedToWorkspaceOnly } from "@/lib/admin-roles";
import { useAdminSession } from "@/contexts/AdminSessionContext";

/** Internal users (and admins) may open Client workspace from Home; other /workspace routes stay portal-only. */
const CLIENT_WORKSPACE_PREVIEW_PATHS = ["/workspace/client"];

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const { role, additionalRoles, loading, sessionLoaded } = useAdminSession();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const onClientWorkspacePreview = CLIENT_WORKSPACE_PREVIEW_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const internalPreview =
    onClientWorkspacePreview &&
    !anyEffectiveRole(role, additionalRoles, ["client", "customer_support"]) &&
    !isRestrictedToWorkspaceOnly(role, additionalRoles);
  const allowed = internalPreview || anyEffectiveRole(role, additionalRoles, ["client", "customer_support"]);

  useEffect(() => {
    if (sessionLoaded && !loading && !allowed) {
      router.replace(defaultLandingPath(role, additionalRoles));
    }
  }, [allowed, loading, sessionLoaded, role, additionalRoles, router]);

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
