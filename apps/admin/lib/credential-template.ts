import { DOCUMENT_TEMPLATE_STYLES } from "@/lib/document-template-styles";

export const SIGNATURE_BLOCK_SELECTOR = '[data-signature-block="contractor"]';

export const DEFAULT_SIGNATURE_WIDTH_PX = 260;
export const DEFAULT_SIGNATURE_MIN_HEIGHT_PX = 100;

export function newSignatureCaptureId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `sig-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `sig-${Math.random().toString(36).slice(2, 10)}`;
}

export function createFlowSignatureBlockHtml(captureId = newSignatureCaptureId()): string {
  return `<div data-signature-block="contractor" data-signature-layout="flow" class="signature-block signature-block--flow" contenteditable="false" style="width:auto;max-width:100%;min-width:140px;min-height:${DEFAULT_SIGNATURE_MIN_HEIGHT_PX}px;box-sizing:border-box;">
<button type="button" data-signature-drag-handle class="signature-drag-handle" aria-label="Move signature block">Move</button>
<p><strong>Signature</strong></p>
<div data-signature-capture="${captureId}" class="signature-capture-area"></div>
<span data-signature-resize-handle class="signature-resize-handle" aria-hidden="true"></span>
</div>`;
}

export const SIGNATURE_BLOCK_HTML = createFlowSignatureBlockHtml();

export const TEMPLATE_DOCUMENT_STYLES = DOCUMENT_TEMPLATE_STYLES;

export function getTableColumnCount(table: HTMLTableElement): number {
  let max = 0;
  for (const row of table.querySelectorAll("tr")) {
    let count = 0;
    for (const cell of row.querySelectorAll("td, th")) {
      count += Number.parseInt(cell.getAttribute("colspan") || "1", 10) || 1;
    }
    max = Math.max(max, count);
  }
  return Math.max(max, 1);
}

/** Fix invalid editor markup and colgroups that collapse Word tables to one column. */
export function repairImportedTables(root: ParentNode): void {
  root.querySelectorAll(".table-width-resize-grip, .table-col-resize-grip").forEach((node) => node.remove());

  for (const table of Array.from(root.querySelectorAll("table"))) {
    if (!(table instanceof HTMLTableElement)) continue;

    for (const child of Array.from(table.children)) {
      if (child.tagName !== "CAPTION" && child.tagName !== "COLGROUP" && child.tagName !== "THEAD" && child.tagName !== "TBODY" && child.tagName !== "TFOOT" && child.tagName !== "TR") {
        child.remove();
      }
    }

    const colgroup = table.querySelector("colgroup");
    if (colgroup && !colgroup.hasAttribute("data-user-resized")) {
      const cols = colgroup.querySelectorAll("col").length;
      if (cols !== getTableColumnCount(table)) {
        colgroup.remove();
      }
    }
  }
}

export function stripEditorArtifacts(html: string): string {
  const doc = parseTemplateDoc(html);
  repairImportedTables(doc.body);
  doc.querySelectorAll(".table-width-resize-grip, .table-col-resize-grip").forEach((node) => node.remove());
  return doc.body.innerHTML;
}

export function wrapTemplatePreviewHtml(body: string): string {
  const content = body.trim();
  if (!content) return "";
  if (content.toLowerCase().includes("<html")) return content;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${TEMPLATE_DOCUMENT_STYLES}</style></head><body>${content}</body></html>`;
}

export function hasContractorSignatureBlock(html: string): boolean {
  return html.includes('data-signature-block="contractor"');
}

function parseTemplateDoc(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function ensureTemplateCanvasOnDocument(doc: Document): HTMLElement {
  const body = doc.body;
  let canvas = body.querySelector("[data-template-canvas]") as HTMLElement | null;
  if (!canvas) {
    canvas = doc.createElement("div");
    canvas.setAttribute("data-template-canvas", "true");
    canvas.className = "template-canvas";
    while (body.firstChild) {
      canvas.appendChild(body.firstChild);
    }
    body.appendChild(canvas);
  }
  return canvas;
}

export function prepareTemplateCanvasHtml(html: string): string {
  const doc = parseTemplateDoc(html);
  ensureTemplateCanvasOnDocument(doc);
  return doc.body.innerHTML;
}

function cellText(cell: Element): string {
  return (cell.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function findContractorSignatureCell(root: ParentNode): HTMLTableCellElement | null {
  for (const table of Array.from(root.querySelectorAll("table"))) {
    const rows = Array.from(table.querySelectorAll("tr"));
    let contractorCol = -1;
    for (const row of rows.slice(0, 4)) {
      const cells = Array.from(row.querySelectorAll("td, th"));
      const idx = cells.findIndex((cell) => /for\s+the\s+contractor/i.test(cellText(cell)));
      if (idx >= 0) {
        contractorCol = idx;
        break;
      }
    }
    if (contractorCol < 0) {
      const headerCells = rows[0]?.querySelectorAll("td, th");
      if (headerCells && headerCells.length >= 3) contractorCol = headerCells.length - 1;
    }
    if (contractorCol < 0) continue;

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("td, th"));
      const label = cellText(cells[0] ?? row);
      if (/^signature$/i.test(label) || /^signature\s*:/i.test(label)) {
        const target = cells[contractorCol];
        if (target instanceof HTMLTableCellElement) return target;
      }
    }
  }
  return null;
}

export function applyFlowSignatureStyles(block: HTMLElement): void {
  block.setAttribute("data-signature-layout", "flow");
  block.classList.add("signature-block--flow");
  block.classList.remove("signature-block--free");
  block.style.position = "relative";
  block.style.left = "";
  block.style.top = "";
  block.style.zIndex = "";
  const inTableCell = block.parentElement instanceof HTMLTableCellElement;
  if (inTableCell) {
    block.style.width = block.style.width && block.style.width !== "100%" ? block.style.width : "auto";
    block.style.maxWidth = "100%";
    block.style.minWidth = "120px";
  } else {
    if (!block.style.width || block.style.width === "100%") block.style.width = `${DEFAULT_SIGNATURE_WIDTH_PX}px`;
    if (!block.style.maxWidth) block.style.maxWidth = `${DEFAULT_SIGNATURE_WIDTH_PX}px`;
  }
  if (!block.style.minHeight) block.style.minHeight = `${DEFAULT_SIGNATURE_MIN_HEIGHT_PX}px`;
  block.style.boxSizing = "border-box";
}

export function ensureEditorChrome(block: HTMLElement): void {
  if (!block.querySelector("[data-signature-drag-handle]")) {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.setAttribute("data-signature-drag-handle", "");
    handle.className = "signature-drag-handle";
    handle.setAttribute("aria-label", "Move signature block");
    handle.textContent = "Move";
    block.insertBefore(handle, block.firstChild);
  }
  if (!block.querySelector("[data-signature-resize-handle]")) {
    const resize = document.createElement("span");
    resize.setAttribute("data-signature-resize-handle", "");
    resize.className = "signature-resize-handle";
    resize.setAttribute("aria-hidden", "true");
    block.appendChild(resize);
  }
}

export function prepareCellForSignature(cell: HTMLTableCellElement): void {
  cell.classList.add("signature-host-cell");
  cell.style.verticalAlign = "top";
  cell.style.overflow = "visible";
  const block = cell.querySelector(SIGNATURE_BLOCK_SELECTOR);
  const blockHeight = block instanceof HTMLElement ? block.offsetHeight : DEFAULT_SIGNATURE_MIN_HEIGHT_PX;
  const minH = Math.max(DEFAULT_SIGNATURE_MIN_HEIGHT_PX + 28, blockHeight + 28);
  cell.style.minHeight = `${minH}px`;
}

function upgradeLegacySignatureBlock(block: HTMLElement): void {
  const strong = block.querySelector("p strong, strong");
  if (strong) strong.textContent = "Signature";
  block.querySelectorAll(".signature-hint").forEach((node) => node.remove());
  const capture = block.querySelector("[data-signature-capture]");
  if (capture instanceof HTMLElement && !capture.getAttribute("data-signature-capture")?.trim()) {
    capture.setAttribute("data-signature-capture", newSignatureCaptureId());
  }
  if (!block.querySelector("[data-signature-capture]")) {
    const captureId = newSignatureCaptureId();
    const area = document.createElement("div");
    area.setAttribute("data-signature-capture", captureId);
    area.className = "signature-capture-area";
    block.appendChild(area);
  }
}

/** Move overlay/free blocks into document flow so tables reflow around them. */
export function normalizeSignatureBlockToFlow(canvas: HTMLElement): void {
  const blocks = Array.from(canvas.querySelectorAll(SIGNATURE_BLOCK_SELECTOR)).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  if (!blocks.length) return;

  const seenCaptureIds = new Set<string>();
  for (const block of blocks) {
    const capture = block.querySelector("[data-signature-capture]");
    if (!(capture instanceof HTMLElement)) continue;
    let id = capture.getAttribute("data-signature-capture") ?? "";
    if (!id || id === "contractor" || seenCaptureIds.has(id)) {
      id = newSignatureCaptureId();
      capture.setAttribute("data-signature-capture", id);
    }
    seenCaptureIds.add(id);
  }

  const contractorCell = findContractorSignatureCell(canvas);

  for (const block of blocks) {
    upgradeLegacySignatureBlock(block);
    applyFlowSignatureStyles(block);
    ensureEditorChrome(block);

    const layout = block.getAttribute("data-signature-layout");
    const parent = block.parentElement;
    const inFlowParent =
      parent instanceof HTMLTableCellElement ||
      parent instanceof HTMLParagraphElement ||
      (parent instanceof HTMLDivElement && !parent.hasAttribute("data-template-canvas"));

    const isOverlay =
      layout === "free" ||
      block.style.position === "absolute" ||
      parent?.hasAttribute("data-template-canvas");

    if (!isOverlay && inFlowParent) {
      if (parent instanceof HTMLTableCellElement) prepareCellForSignature(parent);
      continue;
    }

    if (!isOverlay) continue;

    if (contractorCell && parent?.hasAttribute("data-template-canvas") && blocks.length === 1) {
      block.remove();
      contractorCell.appendChild(block);
      prepareCellForSignature(contractorCell);
      continue;
    }

    if (parent?.hasAttribute("data-template-canvas")) {
      block.remove();
      const anchor = document.createElement("p");
      anchor.className = "signature-flow-anchor";
      anchor.appendChild(block);
      canvas.appendChild(anchor);
    }
  }
}

export function findDropContainer(element: Element | null, canvas: HTMLElement): HTMLElement {
  let node: Element | null = element;
  while (node && node !== canvas) {
    if (node instanceof HTMLTableCellElement) return node;
    if (node instanceof HTMLParagraphElement) return node;
    if (node instanceof HTMLDivElement && !node.hasAttribute("data-template-canvas")) return node;
    if (node instanceof HTMLTableElement) {
      const cell = node.querySelector("td, th");
      if (cell instanceof HTMLTableCellElement) return cell;
    }
    node = node.parentElement;
  }
  return canvas;
}

export function insertSignatureInContractorCell(html: string): string {
  const doc = parseTemplateDoc(html);
  const canvas = ensureTemplateCanvasOnDocument(doc);
  const cell = findContractorSignatureCell(canvas);
  if (cell && !cell.querySelector(SIGNATURE_BLOCK_SELECTOR)) {
    cell.insertAdjacentHTML("beforeend", createFlowSignatureBlockHtml());
  } else {
    canvas.insertAdjacentHTML("beforeend", createFlowSignatureBlockHtml());
  }
  return doc.body.innerHTML;
}

export function serializeTemplateHtmlFromCanvas(canvas: HTMLElement): string {
  const root = canvas.closest("[data-template-canvas]") as HTMLElement | null;
  const raw = root?.outerHTML ?? canvas.outerHTML;
  return stripEditorArtifacts(raw);
}

export function appendSignatureBlock(sourceHtml: string): string {
  const doc = parseTemplateDoc(sourceHtml);
  const canvas = ensureTemplateCanvasOnDocument(doc);
  canvas.insertAdjacentHTML("beforeend", createFlowSignatureBlockHtml());
  return doc.body.innerHTML;
}

export function buildHtmlWithSignatureBlock(sourceHtml: string): string {
  if (hasContractorSignatureBlock(sourceHtml)) {
    return sourceHtml;
  }
  if (/\{contractor_signature\}/i.test(sourceHtml)) {
    return sourceHtml.replace(/\{contractor_signature\}/i, SIGNATURE_BLOCK_HTML);
  }
  return insertSignatureInContractorCell(sourceHtml);
}
