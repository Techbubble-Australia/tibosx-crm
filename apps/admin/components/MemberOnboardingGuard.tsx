"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";

const ALLOWED_PREFIXES = [
  "/settings/profile",
  "/login",
  "/change-password",
  "/mfa-setup",
  "/workspace",
];

function pathAllowed(pathname: string) {
  return ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function MemberOnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, additionalRoles } = useAdminSession();
  const staffExemptFromConsultantProfile =
    role === "admin" ||
    role === "project_manager" ||
    additionalRoles.includes("admin") ||
    additionalRoles.includes("project_manager");

  useEffect(() => {
    if (pathAllowed(pathname)) return;
    if (staffExemptFromConsultantProfile) return;

    void adminFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const user = data?.data?.user;
        const onboarding = user.onboarding as {
          hasAgreementAssignment?: boolean;
          agreementSigned?: boolean;
          profileComplete?: boolean;
        } | null;
        if (!onboarding) return;
        if (onboarding.hasAgreementAssignment && !onboarding.agreementSigned) return;
        if (onboarding.agreementSigned && !onboarding.profileComplete) {
          router.replace("/settings/profile?onboarding=1");
        }
      })
      .catch(() => undefined);
  }, [pathname, router, staffExemptFromConsultantProfile]);

  return children;
}
