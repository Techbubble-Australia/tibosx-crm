"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultLandingPath } from "@/lib/admin-roles";
import { useAdminSession } from "@/contexts/AdminSessionContext";

type Props = {
  children: React.ReactNode;
  requireManageProjects?: boolean;
};

export function ProjectManagementGuard({ children, requireManageProjects = false }: Props) {
  const {
    canAccessProjectManagement,
    canAccessProjectManagementTimesheets,
    canManageProjects,
    loading,
    role,
  } = useAdminSession();
  const canAccess = canAccessProjectManagement || canAccessProjectManagementTimesheets;
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!canAccess) {
      router.replace(defaultLandingPath(role));
      return;
    }
    if (requireManageProjects && !canManageProjects) {
      router.replace("/timesheets");
    }
  }, [canAccess, canManageProjects, loading, requireManageProjects, role, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  if (!canAccess) return null;
  if (requireManageProjects && !canManageProjects) return null;

  return children;
}
