"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import {
  type AdminRole,
  canAccessModuleWithRoles,
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

export type MemberOnboardingState = {
  hasAgreementAssignment: boolean;
  agreementSigned: boolean;
  profileComplete: boolean;
  canSubmitTimesheets: boolean;
  profileOnboardingRequired: boolean;
  requireProfileAfterFirstLogin: boolean;
  profileKycStatus: string;
  inviteCount: number;
};

export type ImpersonationState = {
  impersonatorId: string;
  impersonatorName: string;
};

type AdminSession = {
  role: AdminRole;
  additionalRoles: AdminRole[];
  email: string;
  userId: string;
  userName: string | null;
  profilePhotoUrl: string | null;
  impersonation: ImpersonationState | null;
  memberOnboarding: MemberOnboardingState | null;
  loading: boolean;
  /** False until the first /api/auth/me request has finished (avoids role flash redirects). */
  sessionLoaded: boolean;
  refreshSession: () => Promise<void>;
  canAccessRecruitment: boolean;
  canAccessWebsite: boolean;
  canAccessSales: boolean;
  canAccessProjectManagement: boolean;
  canManageProjects: boolean;
  isProjectMember: boolean;
  isEffectiveProjectMember: boolean;
  canAccessProjectManagementTimesheets: boolean;
  canAccessWorkspaceTimesheets: boolean;
  /** Client contact has "Access to client workspace" ticked. */
  canAccessClientWorkspace: boolean;
  canCreateTimesheets: boolean;
  canLogOwnTimesheets: boolean;
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
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [canAccessProjectManagementTimesheets, setCanAccessProjectManagementTimesheets] = useState(false);
  const [canAccessWorkspaceTimesheets, setCanAccessWorkspaceTimesheets] = useState(false);
  const [canAccessClientWorkspace, setCanAccessClientWorkspace] = useState(false);
  const [canLogOwnTimesheets, setCanLogOwnTimesheets] = useState(false);
  const [memberOnboarding, setMemberOnboarding] = useState<MemberOnboardingState | null>(null);
  const [impersonation, setImpersonation] = useState<ImpersonationState | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const res = await adminFetch("/api/auth/me");
      const data = await res.json();
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
      const access = data?.data?.user?.timesheetAccess as {
        projectManagementTimesheets?: boolean;
        workspaceTimesheets?: boolean;
        canLogOwnTimesheets?: boolean;
      } | null;
      setCanAccessProjectManagementTimesheets(Boolean(access?.projectManagementTimesheets));
      setCanAccessWorkspaceTimesheets(Boolean(access?.workspaceTimesheets));
      setCanLogOwnTimesheets(Boolean(access?.canLogOwnTimesheets));
      setCanAccessClientWorkspace(Boolean(data?.data?.user?.clientWorkspace));
      const onboarding = data?.data?.user?.onboarding as MemberOnboardingState | null | undefined;
      if (onboarding && typeof onboarding === "object") {
        setMemberOnboarding({
          hasAgreementAssignment: Boolean(onboarding.hasAgreementAssignment),
          agreementSigned: Boolean(onboarding.agreementSigned),
          profileComplete: Boolean(onboarding.profileComplete),
          canSubmitTimesheets: Boolean(onboarding.canSubmitTimesheets),
          profileOnboardingRequired: Boolean(onboarding.profileOnboardingRequired),
          requireProfileAfterFirstLogin: Boolean(onboarding.requireProfileAfterFirstLogin),
          profileKycStatus:
            typeof onboarding.profileKycStatus === "string" ? onboarding.profileKycStatus : "INCOMPLETE",
          inviteCount: typeof onboarding.inviteCount === "number" ? onboarding.inviteCount : 0,
        });
      } else {
        setMemberOnboarding(null);
      }
      const imp = data?.data?.impersonation as ImpersonationState | null | undefined;
      if (imp && typeof imp.impersonatorId === "string") {
        setImpersonation({
          impersonatorId: imp.impersonatorId,
          impersonatorName: String(imp.impersonatorName ?? ""),
        });
      } else {
        setImpersonation(null);
      }
    } catch {
      // ignore
    }
    try {
      await fetch("/api/auth/session", { method: "GET", credentials: "include" });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refreshSession().finally(() => {
      setLoading(false);
      setSessionLoaded(true);
    });
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      role,
      additionalRoles,
      email,
      userId,
      userName,
      profilePhotoUrl,
      impersonation,
      memberOnboarding,
      loading,
      sessionLoaded,
      canAccessRecruitment: canAccessRecruitment(role),
      canAccessWebsite: canAccessWebsite(role),
      canAccessSales: canAccessSales(role),
      canAccessProjectManagement: canAccessModuleWithRoles(role, additionalRoles, "project_management"),
      canManageProjects:
        canManageProjects(role) ||
        additionalRoles.some((r) => r === "project_manager" || r === "admin"),
      isProjectMember: isProjectMember(role),
      isEffectiveProjectMember: isEffectiveProjectMember(role, additionalRoles),
      canAccessProjectManagementTimesheets,
      canAccessWorkspaceTimesheets,
      canAccessClientWorkspace,
      canCreateTimesheets: canLogOwnTimesheets,
      canLogOwnTimesheets,
      canManageUsers: canManageUsers(role),
      canManageClients: canManageClients(role),
      canManageJobs: canManageJobs(role),
      canViewJobs: canViewJobs(role),
      canEditProfiles: canEditProfiles(role),
      canDeleteProfiles: canDeleteProfiles(role),
      canManageProfileOwnership: canManageProfileOwnership(role),
      refreshSession,
    }),
    [
      role,
      additionalRoles,
      email,
      userId,
      userName,
      profilePhotoUrl,
      impersonation,
      memberOnboarding,
      loading,
      sessionLoaded,
      canAccessProjectManagementTimesheets,
      canAccessWorkspaceTimesheets,
      canAccessClientWorkspace,
      canLogOwnTimesheets,
      refreshSession,
    ],
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
