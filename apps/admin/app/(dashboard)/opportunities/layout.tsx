"use client";

import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

/** Tabs live in OpportunitiesShell (Board | List | Forecast) per wireframe. */
export default function OpportunitiesLayout({ children }: { children: React.ReactNode }) {
  return <ClientsOnlyGuard>{children}</ClientsOnlyGuard>;
}
