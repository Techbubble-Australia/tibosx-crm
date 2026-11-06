"use client";

import { useEffect } from "react";
import { Bug, Monitor } from "lucide-react";
import { useDebugMode } from "@/contexts/DebugModeContext";
import { ReportedTicketsLink } from "@/components/ReportedTicketsLink";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable=true]"));
}

export function DebugToolbar() {
  const { isDebugActive, toggleDebug, openTicketFromViewport } = useDebugMode();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.key.toLowerCase() !== "d") return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      toggleDebug();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleDebug]);

  return (
    <div data-debug-ui className="fixed bottom-4 right-4 z-[150] flex items-center gap-2">
      <ReportedTicketsLink variant="toolbar" />
      {isDebugActive ? (
        <button
          type="button"
          onClick={() => void openTicketFromViewport()}
          className="inline-flex items-center gap-2 rounded-full border border-sky-500 bg-white px-3 py-2 text-xs font-semibold text-sky-800 shadow-lg dark:border-sky-400 dark:bg-gray-900 dark:text-sky-100"
          title="Capture visible screen as debug ticket"
        >
          <Monitor className="h-4 w-4" />
          Screen
        </button>
      ) : null}
      <button
        type="button"
        onClick={toggleDebug}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg ${
          isDebugActive
            ? "border-sky-600 bg-sky-600 text-white"
            : "border-gray-300 bg-white text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        }`}
        title="Toggle debug mode (Ctrl/Cmd+Shift+D)"
      >
        <Bug className="h-4 w-4" />
        Debug: {isDebugActive ? "ON" : "OFF"}
      </button>
    </div>
  );
}
