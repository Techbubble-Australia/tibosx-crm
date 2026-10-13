"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { ticketingFetch } from "@/lib/ticketing-fetch";

type Me = {
  name: string;
  email: string;
  role: string;
  tbosRole?: string | null;
  canApproveTimesheets?: boolean;
  profilePhotoUrl?: string | null;
  organization?: { name: string } | null;
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);

  useEffect(() => {
    void ticketingFetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          window.location.assign("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data?.data) {
          window.location.assign("/login");
          return;
        }
        setUser(data.data as Me);
      })
      .catch(() => {
        window.location.assign("/login");
      });
  }, []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return <PortalShell user={user}>{children}</PortalShell>;
}
