"use client";

import { useEffect, useRef, useState } from "react";
import { useDebugMode } from "@/contexts/DebugModeContext";

type HoverBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function isExemptFromDebugCapture(el: Element | null): boolean {
  if (!el) return false;
  return Boolean(el.closest("[data-debug-ui], [role='alertdialog']"));
}

export function DebugInspector() {
  const { isDebugActive, modalOpen, openTicketFromElement } = useDebugMode();
  const [hoverBox, setHoverBox] = useState<HoverBox | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const hoveredRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!isDebugActive || modalOpen) {
      setHoverBox(null);
      hoveredRef.current = null;
      return;
    }

    function onMouseMove(e: MouseEvent) {
      const target = e.target instanceof Element ? e.target : null;
      if (!target || isExemptFromDebugCapture(target)) {
        setHoverBox(null);
        hoveredRef.current = null;
        return;
      }
      hoveredRef.current = target;
      const rect = target.getBoundingClientRect();
      setHoverBox({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      setCursor({ x: e.clientX, y: e.clientY });
    }

    function onMouseOut() {
      setHoverBox(null);
      hoveredRef.current = null;
    }

    function onClick(e: MouseEvent) {
      if (!isDebugActive || modalOpen) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target || isExemptFromDebugCapture(target)) return;
      e.preventDefault();
      e.stopPropagation();
      void openTicketFromElement(target);
    }

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseout", onMouseOut, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("mouseout", onMouseOut, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [isDebugActive, modalOpen, openTicketFromElement]);

  if (!isDebugActive || modalOpen) return null;

  return (
    <div data-debug-ui className="pointer-events-none fixed inset-0 z-[145]">
      {hoverBox ? (
        <div
          className="absolute rounded-sm border-2 border-dashed border-sky-500 bg-sky-500/5"
          style={{
            top: hoverBox.top,
            left: hoverBox.left,
            width: hoverBox.width,
            height: hoverBox.height,
          }}
        />
      ) : null}
      {hoverBox ? (
        <div
          className="absolute rounded-md bg-sky-600 px-2 py-1 text-[11px] font-medium text-white shadow"
          style={{ top: cursor.y + 14, left: cursor.x + 12 }}
        >
          Inspect element 🐛
        </div>
      ) : null}
    </div>
  );
}
