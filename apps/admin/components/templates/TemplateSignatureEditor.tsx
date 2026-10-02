"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  normalizeSignatureBlockLayout,
  placeSignatureBlockAt,
  prepareTemplateCanvasHtml,
  serializeTemplateHtmlFromCanvas,
  TEMPLATE_DOCUMENT_STYLES,
} from "@/lib/credential-template";

type Props = {
  html: string;
  onHtmlChange: (html: string) => void;
  dragOver: boolean;
  onDragOverChange: (value: boolean) => void;
  signaturePaletteActive: boolean;
  onPaletteActiveChange: (value: boolean) => void;
};

export function TemplateSignatureEditor({
  html,
  onHtmlChange,
  dragOver,
  onDragOverChange,
  signaturePaletteActive,
  onPaletteActiveChange,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLElement | null>(null);
  const syncingRef = useRef(false);

  const syncHtmlFromCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || syncingRef.current) return;
    const next = serializeTemplateHtmlFromCanvas(canvas);
    if (next !== html) onHtmlChange(next);
  }, [html, onHtmlChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (canvasRef.current) {
      const current = serializeTemplateHtmlFromCanvas(canvasRef.current);
      if (current === html || prepareTemplateCanvasHtml(html) === current) {
        return;
      }
    }

    syncingRef.current = true;
    const prepared = prepareTemplateCanvasHtml(html);
    host.innerHTML = prepared;
    const mounted = host.querySelector("[data-template-canvas]") as HTMLElement | null;
    if (!mounted) return;
    canvasRef.current = mounted;

    normalizeSignatureBlockLayout(mounted);
    attachInteractions(mounted, syncHtmlFromCanvas);
    syncingRef.current = false;
  }, [html, syncHtmlFromCanvas]);

  function dropSignatureAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const left = clientX - rect.left + canvas.scrollLeft - 12;
    const top = clientY - rect.top + canvas.scrollTop - 12;
    const next = placeSignatureBlockAt(html, Math.max(0, left), Math.max(0, top));
    onHtmlChange(next);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-white dark:border-gray-700 ${
        dragOver ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        onDragOverChange(true);
      }}
      onDragLeave={() => onDragOverChange(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDragOverChange(false);
        onPaletteActiveChange(false);
        if (e.dataTransfer.getData("text/plain") === "signature-block") {
          dropSignatureAt(e.clientX, e.clientY);
        }
      }}
    >
      <style>{TEMPLATE_DOCUMENT_STYLES}</style>
      <div
        ref={hostRef}
        className={`template-editor-host h-[520px] overflow-auto bg-white p-0 ${
          signaturePaletteActive ? "ring-2 ring-inset ring-blue-200" : ""
        }`}
      />
    </div>
  );
}

function attachInteractions(canvas: HTMLElement, onChange: () => void) {
  const blockEl = canvas.querySelector('[data-signature-block="contractor"]');
  if (!(blockEl instanceof HTMLElement)) return;
  const block: HTMLElement = blockEl;

  const dragHandle = block.querySelector("[data-signature-drag-handle]");
  const resizeHandle = block.querySelector("[data-signature-resize-handle]");

  if (dragHandle instanceof HTMLElement) {
    dragHandle.onmousedown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = parsePx(block.style.left);
      const startTop = parsePx(block.style.top);

      function onMove(moveEvent: MouseEvent) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        block.style.left = `${Math.max(0, startLeft + dx)}px`;
        block.style.top = `${Math.max(0, startTop + dy)}px`;
      }

      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        onChange();
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
  }

  if (resizeHandle instanceof HTMLElement) {
    resizeHandle.onmousedown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      const startW = block.offsetWidth;
      const startH = block.offsetHeight;

      function onMove(moveEvent: MouseEvent) {
        const w = Math.max(160, startW + moveEvent.clientX - startX);
        const h = Math.max(80, startH + moveEvent.clientY - startY);
        block.style.width = `${w}px`;
        block.style.minHeight = `${h}px`;
      }

      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        onChange();
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
  }

  block.onmousedown = (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-signature-drag-handle], [data-signature-resize-handle]")) return;
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = parsePx(block.style.left);
    const startTop = parsePx(block.style.top);

    function onMove(moveEvent: MouseEvent) {
      block.style.left = `${Math.max(0, startLeft + moveEvent.clientX - startX)}px`;
      block.style.top = `${Math.max(0, startTop + moveEvent.clientY - startY)}px`;
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      onChange();
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
}

function parsePx(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
