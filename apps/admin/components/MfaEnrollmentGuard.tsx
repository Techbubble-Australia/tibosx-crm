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
    setAllowed(false);
    void adminFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const user = data?.data?.user;
        if (user?.passwordNeedsReset === true) {
          window.location.assign("/change-password");
          return;
        }
        if (user?.mfaEnabled === false) {
          window.location.assign("/mfa-setup");
          return;
        }
        setAllowed(true);
      })
      .catch(() => {
        router.replace("/login");
      });
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
