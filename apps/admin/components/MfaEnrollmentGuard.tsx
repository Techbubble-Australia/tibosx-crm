"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";

const MFA_SETUP_PATH = "/settings/security";

export function MfaEnrollmentGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === MFA_SETUP_PATH || pathname.startsWith(`${MFA_SETUP_PATH}/`)) {
      return;
    }

    void adminFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const mfaEnabled = data?.data?.user?.mfaEnabled;
        if (mfaEnabled === false) {
          router.replace(`${MFA_SETUP_PATH}?mfa=required`);
        }
      })
      .catch(() => undefined);
  }, [pathname, router]);

  return children;
}
