"use client";

import { AdminOnlyGuard } from "@/components/AdminOnlyGuard";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <AdminOnlyGuard>{children}</AdminOnlyGuard>;
}
