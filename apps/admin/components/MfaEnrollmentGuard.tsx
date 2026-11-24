"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

export function MfaEnrollmentGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAllowed(false);

    void adminFetch("/api/auth/me")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const impersonating = Boolean(data?.data?.impersonation?.impersonatorId);
        const user = data?.data?.user as
          | {
              passwordNeedsReset?: boolean;
              mfaEnabled?: boolean;
              requiresMfaEnrollment?: boolean;
            }
          | undefined;

        if (impersonating) {
          setAllowed(true);
          return;
        }

        if (user?.passwordNeedsReset === true) {
          window.location.assign("/change-password");
          return;
        }

        const requiresMfaEnrollment = Boolean(user?.requiresMfaEnrollment);
        if (requiresMfaEnrollment) {
          const resumeRes = await fetch("/api/auth/mfa/resume-session", {
            method: "POST",
            credentials: "include",
          });
          if (resumeRes.ok) {
            setAllowed(true);
            return;
          }
          window.location.assign("/mfa-setup");
          return;
        }

        // Internal users may leave MFA off; only incomplete setup sessions are forced above.
        setAllowed(true);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" aria-label="Loading" />
      </div>
    );
  }

  return children;
}
