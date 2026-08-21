"use client";

import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

export default function OpportunitiesLayout({ children }: { children: React.ReactNode }) {
  return <ClientsOnlyGuard>{children}</ClientsOnlyGuard>;
}
