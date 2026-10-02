"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  applyFlowSignatureStyles,
  createFlowSignatureBlockHtml,
  ensureEditorChrome,
  findDropContainer,
  normalizeSignatureBlockToFlow,
  prepareCellForSignature,
  prepareTemplateCanvasHtml,
  repairImportedTables,
  serializeTemplateHtmlFromCanvas,
  SIGNATURE_BLOCK_SELECTOR,
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
  const dropHighlightRef = useRef<HTMLElement | null>(null);
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
    host.innerHTML = prepareTemplateCanvasHtml(html);
    const mounted = host.querySelector("[data-template-canvas]") as HTMLElement | null;
    if (!mounted) return;
    canvasRef.current = mounted;

    repairImportedTables(mounted);
    normalizeSignatureBlockToFlow(mounted);
    attachContentEditable(mounted, syncHtmlFromCanvas);
    attachEditorInteractions(mounted, syncHtmlFromCanvas, dropHighlightRef);
    syncingRef.current = false;
  }, [html, syncHtmlFromCanvas]);

  function dropSignatureAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = document.elementFromPoint(clientX, clientY);
    const container = findDropContainer(target, canvas);

    let block = canvas.querySelector(SIGNATURE_BLOCK_SELECTOR);
    if (!(block instanceof HTMLElement)) {
      container.insertAdjacentHTML("beforeend", createFlowSignatureBlockHtml());
      block = canvas.querySelector(SIGNATURE_BLOCK_SELECTOR);
    } else {
      applyFlowSignatureStyles(block);
      container.appendChild(block);
    }

    if (block instanceof HTMLElement) {
      ensureEditorChrome(block);
      if (container instanceof HTMLTableCellElement) prepareCellForSignature(container);
    }

    clearDropHighlight(dropHighlightRef);
    syncHtmlFromCanvas();
  }

  function runFormat(command: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.focus();
    document.execCommand(command, false);
    syncHtmlFromCanvas();
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
        const canvas = canvasRef.current;
        if (!canvas) return;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        highlightDropTarget(findDropContainer(target, canvas), dropHighlightRef);
      }}
      onDragLeave={() => {
        onDragOverChange(false);
        clearDropHighlight(dropHighlightRef);
      }}
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
      <div className="template-format-toolbar flex flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/50">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runFormat("bold")}>
          Bold
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runFormat("italic")}>
          Italic
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runFormat("underline")}>
          Underline
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runFormat("insertUnorderedList")}>
          Bullets
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runFormat("insertOrderedList")}>
          Numbered list
        </button>
        <span className="self-center text-xs text-gray-500">Click in the document to edit text, tables, and cells like Word.</span>
      </div>
      <div
        ref={hostRef}
        className={`template-editor-host h-[520px] overflow-auto bg-white p-0 ${
          signaturePaletteActive ? "ring-2 ring-inset ring-blue-200" : ""
        }`}
      />
    </div>
  );
}

function attachContentEditable(canvas: HTMLElement, onChange: () => void) {
  canvas.setAttribute("contenteditable", "true");
  canvas.setAttribute("spellcheck", "true");
  canvas.classList.add("template-canvas-editable");

  let inputTimer: number | undefined;
  canvas.addEventListener("input", () => {
    window.clearTimeout(inputTimer);
    inputTimer = window.setTimeout(() => onChange(), 200);
  });

  canvas.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") ?? "";
    document.execCommand("insertText", false, text);
    onChange();
  });
}

function attachEditorInteractions(
  canvas: HTMLElement,
  onChange: () => void,
  dropHighlightRef: React.MutableRefObject<HTMLElement | null>,
) {
  attachSignatureInteractions(canvas, onChange, dropHighlightRef);
  attachTableWidthResize(canvas, onChange);
}

function attachSignatureInteractions(
  canvas: HTMLElement,
  onChange: () => void,
  dropHighlightRef: React.MutableRefObject<HTMLElement | null>,
) {
  const blockEl = canvas.querySelector(SIGNATURE_BLOCK_SELECTOR);
  if (!(blockEl instanceof HTMLElement)) return;
  const block: HTMLElement = blockEl;

  const startMove = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const onMove = (moveEvent: MouseEvent) => {
      const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      highlightDropTarget(findDropContainer(target, canvas), dropHighlightRef);
    };

    const onUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const container = findDropContainer(target, canvas);
      if (container !== block.parentElement) {
        applyFlowSignatureStyles(block);
        container.appendChild(block);
        if (container instanceof HTMLTableCellElement) prepareCellForSignature(container);
      }
      clearDropHighlight(dropHighlightRef);
      onChange();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const dragHandle = block.querySelector("[data-signature-drag-handle]");
  if (dragHandle instanceof HTMLElement) {
    dragHandle.onmousedown = startMove;
  }

  const resizeHandle = block.querySelector("[data-signature-resize-handle]");
  if (resizeHandle instanceof HTMLElement) {
    resizeHandle.onmousedown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      const startW = block.offsetWidth;
      const startH = block.offsetHeight;

      const onMove = (moveEvent: MouseEvent) => {
        const w = Math.max(140, startW + moveEvent.clientX - startX);
        const h = Math.max(72, startH + moveEvent.clientY - startY);
        block.style.width = `${w}px`;
        block.style.maxWidth = "100%";
        block.style.minHeight = `${h}px`;
        const parent = block.parentElement;
        if (parent instanceof HTMLTableCellElement) prepareCellForSignature(parent);
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        onChange();
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
  }
}

function attachTableWidthResize(canvas: HTMLElement, onChange: () => void) {
  for (const table of Array.from(canvas.querySelectorAll("table"))) {
    if (!(table instanceof HTMLTableElement)) continue;

    let host = table.parentElement;
    if (!host?.classList.contains("template-table-host")) {
      const wrapper = document.createElement("div");
      wrapper.className = "template-table-host";
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      host = wrapper;
    }
    if (!host) continue;

    if (host.querySelector(".table-width-resize-grip")) continue;

    const widthGrip = document.createElement("span");
    widthGrip.className = "table-width-resize-grip";
    widthGrip.setAttribute("aria-hidden", "true");
    widthGrip.onmousedown = (event) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = table.getBoundingClientRect().width;

      const onMove = (moveEvent: MouseEvent) => {
        const next = Math.max(240, startWidth + moveEvent.clientX - startX);
        table.style.width = `${Math.round(next)}px`;
        table.style.maxWidth = "100%";
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        onChange();
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
    host.appendChild(widthGrip);
  }
}

function highlightDropTarget(
  target: HTMLElement,
  dropHighlightRef: React.MutableRefObject<HTMLElement | null>,
) {
  clearDropHighlight(dropHighlightRef);
  if (target.hasAttribute("data-template-canvas")) return;
  target.classList.add("template-drop-target");
  dropHighlightRef.current = target;
}

function clearDropHighlight(dropHighlightRef: React.MutableRefObject<HTMLElement | null>) {
  dropHighlightRef.current?.classList.remove("template-drop-target");
  dropHighlightRef.current = null;
}
