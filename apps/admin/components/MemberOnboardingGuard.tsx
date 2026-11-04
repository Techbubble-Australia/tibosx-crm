"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminSession } from "@/contexts/AdminSessionContext";

const ALLOWED_PREFIXES = [
  "/settings/profile",
  "/login",
  "/change-password",
  "/mfa-setup",
  "/workspace",
  "/timesheets",
  "/projects",
  "/my-workspace",
];

function pathAllowed(pathname: string) {
  return ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function MemberOnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { memberOnboarding, impersonation, sessionLoaded, role, additionalRoles } = useAdminSession();
  const isClientUser =
    role === "client" || additionalRoles.some((r) => r === "client");

  useEffect(() => {
    if (!sessionLoaded || isClientUser || pathAllowed(pathname) || impersonation) return;
    const onboarding = memberOnboarding;
    if (!onboarding?.profileOnboardingRequired) return;
    if (onboarding.hasAgreementAssignment && !onboarding.agreementSigned) return;
    router.replace("/settings/profile?onboarding=1");
  }, [pathname, router, memberOnboarding, impersonation, sessionLoaded, isClientUser]);

  return children;
}
