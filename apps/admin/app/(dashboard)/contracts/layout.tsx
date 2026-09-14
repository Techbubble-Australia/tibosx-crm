"use client";

import { ClientsOnlyGuard } from "@/components/ClientsOnlyGuard";

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return <ClientsOnlyGuard>{children}</ClientsOnlyGuard>;
}
