"use client";

import { useEffect } from "react";
import { Bug } from "lucide-react";
import { useDebugMode } from "@/contexts/DebugModeContext";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable=true]"));
}

export function DebugToolbar() {
  const { isDebugActive, toggleDebug } = useDebugMode();

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
    <div className="fixed bottom-4 right-4 z-[150] flex items-center gap-2">
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
