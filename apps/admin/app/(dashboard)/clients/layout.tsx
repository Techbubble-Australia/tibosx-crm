"use client";

import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <ClientsOnlyGuard>{children}</ClientsOnlyGuard>;
}
