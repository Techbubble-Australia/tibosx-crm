"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import {
  type AdminRole,
  canManageClients,
  canManageUsers,
  canMutateContent,
  isAdminRole,
} from "@/lib/admin-roles";

type AdminSession = {
  role: AdminRole;
  email: string;
  loading: boolean;
  canMutate: boolean;
  canManageUsers: boolean;
  canManageClients: boolean;
};

const AdminSessionContext = createContext<AdminSession | null>(null);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AdminRole>("viewer");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const userRole = data?.data?.user?.role;
        if (typeof userRole === "string" && isAdminRole(userRole)) {
          setRole(userRole);
        }
        const userEmail = data?.data?.user?.email;
        if (typeof userEmail === "string") {
          setEmail(userEmail);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      role,
      email,
      loading,
      canMutate: canMutateContent(role),
      canManageUsers: canManageUsers(role),
      canManageClients: canManageClients(role),
    }),
    [role, email, loading],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession(): AdminSession {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }
  return ctx;
}
