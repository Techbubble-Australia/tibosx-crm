"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/contexts/AdminSessionContext";

export function AdminOnlyGuard({ children }: { children: React.ReactNode }) {
  const { canManageUsers, loading } = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !canManageUsers) {
      router.replace("/database/dashboard");
    }
  }, [canManageUsers, loading, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  if (!canManageUsers) {
    return null;
  }

  return children;
}
