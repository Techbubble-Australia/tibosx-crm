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

    container.insertAdjacentHTML("beforeend", createFlowSignatureBlockHtml());
    const inserted = container.querySelectorAll(SIGNATURE_BLOCK_SELECTOR);
    const block = inserted[inserted.length - 1];

    if (block instanceof HTMLElement) {
      applyFlowSignatureStyles(block);
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

  function applyFontSize(sizePt: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement("span");
    span.style.fontSize = sizePt;
    try {
      range.surroundContents(span);
    } catch {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontSize", false, "4");
      syncHtmlFromCanvas();
      return;
    }
    selection.removeAllRanges();
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
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runFormat("indent")} title="Increase list level">
          Indent
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runFormat("outdent")} title="Decrease list level">
          Outdent
        </button>
        <label className="inline-flex items-center gap-1 text-xs text-gray-600">
          Size
          <select
            className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) applyFontSize(v);
              e.target.value = "";
            }}
          >
            <option value="" disabled>—</option>
            <option value="9pt">9</option>
            <option value="10pt">10</option>
            <option value="11pt">11</option>
            <option value="12pt">12</option>
            <option value="14pt">14</option>
            <option value="16pt">16</option>
            <option value="18pt">18</option>
            <option value="22pt">22</option>
          </select>
        </label>
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
  if (canvas.dataset.contentEditableBound === "true") return;
  canvas.dataset.contentEditableBound = "true";

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
  attachSignatureDelegation(canvas, onChange, dropHighlightRef);
  attachTableWidthResize(canvas, onChange);
}

/** Delegated handlers so move/resize work after drop and content edits without re-binding. */
function attachSignatureDelegation(
  canvas: HTMLElement,
  onChange: () => void,
  dropHighlightRef: React.MutableRefObject<HTMLElement | null>,
) {
  if (canvas.dataset.signatureDelegation === "true") return;
  canvas.dataset.signatureDelegation = "true";

  canvas.addEventListener(
    "mousedown",
    (event) => {
      const target = event.target as HTMLElement;
      const block = target.closest(SIGNATURE_BLOCK_SELECTOR);
      if (!(block instanceof HTMLElement) || !canvas.contains(block)) return;

      if (target.closest("[data-signature-resize-handle]")) {
        event.preventDefault();
        startSignatureResize(event, block, onChange);
        return;
      }

      const onMoveHandle = target.closest("[data-signature-drag-handle]");
      const onBlockChrome =
        target === block ||
        Boolean(target.closest(".signature-block > p, .signature-block > strong, .signature-hint"));

      if (onMoveHandle || onBlockChrome) {
        event.preventDefault();
        startSignatureMove(event, block, canvas, onChange, dropHighlightRef);
      }
    },
    true,
  );
}

function startSignatureMove(
  event: MouseEvent,
  block: HTMLElement,
  canvas: HTMLElement,
  onChange: () => void,
  dropHighlightRef: React.MutableRefObject<HTMLElement | null>,
) {
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
      ensureEditorChrome(block);
      if (container instanceof HTMLTableCellElement) prepareCellForSignature(container);
    }
    clearDropHighlight(dropHighlightRef);
    onChange();
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function startSignatureResize(event: MouseEvent, block: HTMLElement, onChange: () => void) {
  event.stopPropagation();

  const parentCell = block.parentElement instanceof HTMLTableCellElement ? block.parentElement : null;
  const maxWidth = parentCell ? Math.max(120, parentCell.clientWidth - 16) : 640;

  const startX = event.clientX;
  const startY = event.clientY;
  const startW = block.offsetWidth;
  const startH = block.offsetHeight;

  const onMove = (moveEvent: MouseEvent) => {
    moveEvent.preventDefault();
    const w = Math.min(maxWidth, Math.max(120, startW + moveEvent.clientX - startX));
    const h = Math.max(72, startH + moveEvent.clientY - startY);
    block.style.width = `${w}px`;
    block.style.maxWidth = "100%";
    block.style.minWidth = "120px";
    block.style.height = `${h}px`;
    block.style.minHeight = `${h}px`;
    if (parentCell) prepareCellForSignature(parentCell);
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    onChange();
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
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
    widthGrip.contentEditable = "false";
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
