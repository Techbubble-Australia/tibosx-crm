"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import {
  type AdminRole,
  canAccessProjectManagement,
  canAccessRecruitment,
  canAccessSales,
  canAccessWebsite,
  canManageProjects,
  isProjectMember,
  isEffectiveProjectMember,
  canDeleteProfiles,
  canEditProfiles,
  canManageClients,
  canManageJobs,
  canManageProfileOwnership,
  canManageUsers,
  canViewJobs,
  isAdminRole,
} from "@/lib/admin-roles";

type AdminSession = {
  role: AdminRole;
  additionalRoles: AdminRole[];
  email: string;
  userId: string;
  userName: string | null;
  profilePhotoUrl: string | null;
  loading: boolean;
  canAccessRecruitment: boolean;
  canAccessWebsite: boolean;
  canAccessSales: boolean;
  canAccessProjectManagement: boolean;
  canManageProjects: boolean;
  isProjectMember: boolean;
  isEffectiveProjectMember: boolean;
  canManageUsers: boolean;
  canManageClients: boolean;
  canManageJobs: boolean;
  canViewJobs: boolean;
  canEditProfiles: boolean;
  canDeleteProfiles: boolean;
  canManageProfileOwnership: boolean;
};

const AdminSessionContext = createContext<AdminSession | null>(null);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AdminRole>("website");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [additionalRoles, setAdditionalRoles] = useState<AdminRole[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
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
        const id = data?.data?.user?.id;
        if (typeof id === "string") {
          setUserId(id);
        }
        const name = data?.data?.user?.name;
        if (typeof name === "string" && name.trim()) {
          setUserName(name.trim());
        } else {
          setUserName(null);
        }
        const extra = data?.data?.user?.additionalRoles;
        if (Array.isArray(extra)) {
          setAdditionalRoles(extra.filter((r): r is AdminRole => typeof r === "string" && isAdminRole(r)));
        } else {
          setAdditionalRoles([]);
        }
        const photo = data?.data?.user?.profilePhotoUrl;
        setProfilePhotoUrl(typeof photo === "string" && photo.trim() ? photo.trim() : null);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      role,
      additionalRoles,
      email,
      userId,
      userName,
      profilePhotoUrl,
      loading,
      canAccessRecruitment: canAccessRecruitment(role),
      canAccessWebsite: canAccessWebsite(role),
      canAccessSales: canAccessSales(role),
      canAccessProjectManagement: canAccessProjectManagement(role),
      canManageProjects: canManageProjects(role),
      isProjectMember: isProjectMember(role),
      isEffectiveProjectMember: isEffectiveProjectMember(role, additionalRoles),
      canManageUsers: canManageUsers(role),
      canManageClients: canManageClients(role),
      canManageJobs: canManageJobs(role),
      canViewJobs: canViewJobs(role),
      canEditProfiles: canEditProfiles(role),
      canDeleteProfiles: canDeleteProfiles(role),
      canManageProfileOwnership: canManageProfileOwnership(role),
    }),
    [role, additionalRoles, email, userId, userName, profilePhotoUrl, loading],
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
