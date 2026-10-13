"use client";

import { WorkspaceGuard } from "@/components/workspace/WorkspaceGuard";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceGuard>{children}</WorkspaceGuard>;
}
