"use client";

import dynamic from "next/dynamic";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { useIsDebugToolsAppEnv } from "@/lib/use-is-debug-tools-app-env";

const DebugModeShell = dynamic(() => import("@/components/debug/DebugModeShell").then((m) => m.DebugModeShell), {
  ssr: false,
});

/** Debug toolbar (debug on/off + reported tickets): development/staging, internal users only. */
export function DebugModeGate() {
  const { role, loading } = useAdminSession();
  const isDebugToolsEnv = useIsDebugToolsAppEnv();

  const isInternalUser = !loading && Boolean(role) && role !== "client";
  if (!isDebugToolsEnv || !isInternalUser) return null;
  return <DebugModeShell />;
}
