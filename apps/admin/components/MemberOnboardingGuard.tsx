"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";

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

  useEffect(() => {
    if (pathAllowed(pathname)) return;

    void adminFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const user = data?.data?.user;
        const roles = [user?.role, ...(Array.isArray(user?.additionalRoles) ? user.additionalRoles : [])].filter(
          (r): r is string => typeof r === "string",
        );
        if (!roles.includes("project_member")) return;
        const onboarding = user.onboarding as {
          hasAgreementAssignment?: boolean;
          agreementSigned?: boolean;
          profileComplete?: boolean;
        } | null;
        if (!onboarding?.hasAgreementAssignment) return;
        if (onboarding.agreementSigned && !onboarding.profileComplete) {
          router.replace("/settings/profile?onboarding=1");
        }
      })
      .catch(() => undefined);
  }, [pathname, router]);

  return children;
}
