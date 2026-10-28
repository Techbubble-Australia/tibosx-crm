"use client";

import { DebugModeProvider } from "@/contexts/DebugModeContext";
import { DebugToolbar } from "@/components/debug/DebugToolbar";
import { DebugInspector } from "@/components/debug/DebugInspector";
import { DebugTicketModal } from "@/components/debug/DebugTicketModal";

export function DebugModeShell() {
  return (
    <DebugModeProvider>
      <DebugToolbar />
      <DebugInspector />
      <DebugTicketModal />
    </DebugModeProvider>
  );
}
