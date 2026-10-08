import {
  applyFlowSignatureStyles,
  createFlowSignatureBlockHtml,
  ensureEditorChrome,
  findDropContainer,
  prepareCellForSignature,
  repairImportedTables,
  SIGNATURE_BLOCK_SELECTOR,
} from "@/lib/credential-template";

export function dropSignatureAt(canvas: HTMLElement, clientX: number, clientY: number, onChange: () => void) {
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

  onChange();
}

export function attachSignatureDelegation(
  canvas: HTMLElement,
  onChange: () => void,
  dropHighlightRef: { current: HTMLElement | null },
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
  dropHighlightRef: { current: HTMLElement | null },
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

export function attachTableWidthResize(canvas: HTMLElement, onChange: () => void) {
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

export function highlightDropTarget(target: HTMLElement, dropHighlightRef: { current: HTMLElement | null }) {
  clearDropHighlight(dropHighlightRef);
  if (target.classList.contains("ProseMirror")) return;
  target.classList.add("template-drop-target");
  dropHighlightRef.current = target;
}

export function clearDropHighlight(dropHighlightRef: { current: HTMLElement | null }) {
  dropHighlightRef.current?.classList.remove("template-drop-target");
  dropHighlightRef.current = null;
}

export function prepareEditorSurface(canvas: HTMLElement) {
  repairImportedTables(canvas);
}
