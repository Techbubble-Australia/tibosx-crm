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

    normalizeSignatureBlockToFlow(mounted);
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
      <div
        ref={hostRef}
        className={`template-editor-host h-[520px] overflow-auto bg-white p-0 ${
          signaturePaletteActive ? "ring-2 ring-inset ring-blue-200" : ""
        }`}
      />
    </div>
  );
}

function attachEditorInteractions(
  canvas: HTMLElement,
  onChange: () => void,
  dropHighlightRef: React.MutableRefObject<HTMLElement | null>,
) {
  attachSignatureInteractions(canvas, onChange, dropHighlightRef);
  attachTableResizeInteractions(canvas, onChange);
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
        const oldParent = block.parentElement;
        if (oldParent instanceof HTMLTableCellElement && !oldParent.textContent?.trim()) {
          oldParent.style.minHeight = "";
        }
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
  block.onmousedown = (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-signature-drag-handle], [data-signature-resize-handle]")) return;
    startMove(event);
  };

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

function attachTableResizeInteractions(canvas: HTMLElement, onChange: () => void) {
  for (const table of Array.from(canvas.querySelectorAll("table"))) {
    if (!(table instanceof HTMLTableElement)) continue;
    table.classList.add("template-editable-table");
    ensureTableColgroup(table);

    if (!table.querySelector(".table-width-resize-grip")) {
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
      table.appendChild(widthGrip);
    }

    const headerRow = table.querySelector("tr");
    if (!headerRow) continue;
    const cells = Array.from(headerRow.querySelectorAll("td, th")).filter(
      (cell): cell is HTMLTableCellElement => cell instanceof HTMLTableCellElement,
    );

    cells.forEach((cell, index) => {
      if (index >= cells.length - 1) return;
      if (cell.querySelector(".table-col-resize-grip")) return;
      cell.style.position = "relative";

      const grip = document.createElement("span");
      grip.className = "table-col-resize-grip";
      grip.setAttribute("aria-hidden", "true");
      grip.onmousedown = (event) => {
        event.preventDefault();
        const col = table.querySelectorAll("col")[index] as HTMLTableColElement | undefined;
        const nextCol = table.querySelectorAll("col")[index + 1] as HTMLTableColElement | undefined;
        if (!col || !nextCol) return;

        const startX = event.clientX;
        const nextCell = cells[index + 1];
        if (!nextCell) return;
        const startW = cell.offsetWidth;
        const startNextW = nextCell.offsetWidth;

        const onMove = (moveEvent: MouseEvent) => {
          const delta = moveEvent.clientX - startX;
          const w1 = Math.max(48, startW + delta);
          const w2 = Math.max(48, startNextW - delta);
          col.style.width = `${w1}px`;
          nextCol.style.width = `${w2}px`;
        };

        const onUp = () => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          onChange();
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      };
      cell.appendChild(grip);
    });
  }
}

function ensureTableColgroup(table: HTMLTableElement) {
  if (table.querySelector("colgroup")) return;
  const firstRow = table.querySelector("tr");
  const count = firstRow?.querySelectorAll("td, th").length ?? 0;
  if (count === 0) return;
  const colgroup = document.createElement("colgroup");
  const tableWidth = table.getBoundingClientRect().width || 600;
  const colWidth = Math.round(tableWidth / count);
  for (let i = 0; i < count; i++) {
    const col = document.createElement("col");
    col.style.width = `${colWidth}px`;
    colgroup.appendChild(col);
  }
  table.insertBefore(colgroup, table.firstChild);
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
