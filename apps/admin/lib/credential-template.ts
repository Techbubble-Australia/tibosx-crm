export const SIGNATURE_BLOCK_SELECTOR = '[data-signature-block="contractor"]';

export const DEFAULT_SIGNATURE_WIDTH_PX = 260;
export const DEFAULT_SIGNATURE_MIN_HEIGHT_PX = 100;

export function createFlowSignatureBlockHtml(): string {
  return `<div data-signature-block="contractor" data-signature-layout="flow" class="signature-block signature-block--flow" contenteditable="false" style="width:auto;max-width:100%;min-width:140px;min-height:${DEFAULT_SIGNATURE_MIN_HEIGHT_PX}px;box-sizing:border-box;">
<button type="button" data-signature-drag-handle class="signature-drag-handle" aria-label="Move signature block">Move</button>
<p><strong>Contractor signature</strong></p>
<div data-signature-capture="contractor" class="signature-capture-area"></div>
<p class="signature-hint">The contractor will sign here in the agreement portal.</p>
<span data-signature-resize-handle class="signature-resize-handle" aria-hidden="true"></span>
</div>`;
}

export const SIGNATURE_BLOCK_HTML = createFlowSignatureBlockHtml();

export const TEMPLATE_DOCUMENT_STYLES = `
.template-canvas { position: relative; min-height: 480px; outline: none; padding: 32px 48px; box-sizing: border-box; }
.template-canvas-editable:focus { box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35); }
body { font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0; padding: 24px; }
table, table.docx-table { width: 100%; max-width: 100%; border-collapse: collapse; margin: 16px 0; table-layout: auto; border: 1px solid #374151; }
.template-table-host { position: relative; max-width: 100%; margin: 16px 0; }
.template-table-host > table { margin: 0; }
td, th { border: 1px solid #374151; padding: 8px 10px; vertical-align: top; word-wrap: break-word; }
th { background: #f3f4f6; font-weight: 600; }
table td p, table th p { margin: 0 0 0.35em 0; }
table td p:last-child, table th p:last-child { margin-bottom: 0; }
h1, h2, h3 { margin-top: 1.25em; margin-bottom: 0.5em; }
ul, ol { margin: 0.5em 0 0.5em 1.25em; }
.signature-block { border: 2px dashed #6b7280; padding: 14px 16px 28px; background: #fafafa; position: relative; }
.signature-block--flow { margin: 8px 0; z-index: auto; }
td.signature-host-cell, th.signature-host-cell { padding: 14px 16px !important; overflow: visible; vertical-align: top; }
td .signature-block--flow, th .signature-block--flow { margin: 0; width: auto; max-width: 100%; min-width: 120px; }
.signature-capture-area { min-height: 56px; border-bottom: 1px solid #374151; margin-top: 8px; }
.signature-hint { margin-top: 6px; font-size: 11px; color: #6b7280; }
.signature-drag-handle { position: absolute; top: 4px; right: 4px; z-index: 12; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; padding: 2px 8px; font-size: 10px; font-family: system-ui, sans-serif; cursor: grab; color: #374151; pointer-events: auto; }
.signature-drag-handle:active { cursor: grabbing; }
.signature-resize-handle { position: absolute; right: 4px; bottom: 4px; width: 20px; height: 20px; cursor: nwse-resize; z-index: 10; pointer-events: auto; touch-action: none; background: linear-gradient(135deg, transparent 52%, #6b7280 52%); }
.template-drop-target { outline: 2px dashed #3b82f6; outline-offset: 2px; background: rgba(59, 130, 246, 0.06); }
.table-width-resize-grip { position: absolute; right: 0; bottom: 0; width: 14px; height: 14px; cursor: nwse-resize; z-index: 4; background: linear-gradient(135deg, transparent 55%, #9ca3af 55%); }
.template-format-toolbar button { border: 1px solid #d1d5db; background: #fff; border-radius: 4px; padding: 4px 8px; font-size: 12px; cursor: pointer; }
.template-format-toolbar button:hover { background: #f3f4f6; }
img { max-width: 100%; height: auto; }
`;

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

/** Move overlay/free blocks into document flow so tables reflow around them. */
export function normalizeSignatureBlockToFlow(canvas: HTMLElement): void {
  const block = canvas.querySelector(SIGNATURE_BLOCK_SELECTOR);
  if (!(block instanceof HTMLElement)) return;

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
    return;
  }

  if (!isOverlay) return;

  const contractorCell = findContractorSignatureCell(canvas);
  if (contractorCell) {
    block.remove();
    contractorCell.appendChild(block);
    prepareCellForSignature(contractorCell);
    return;
  }

  if (parent?.hasAttribute("data-template-canvas")) {
    block.remove();
    const anchor = document.createElement("p");
    anchor.className = "signature-flow-anchor";
    anchor.appendChild(block);
    canvas.appendChild(anchor);
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
  if (canvas.querySelector(SIGNATURE_BLOCK_SELECTOR)) {
    return doc.body.innerHTML;
  }
  const cell = findContractorSignatureCell(canvas);
  if (cell) {
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

export function buildHtmlWithSignatureBlock(sourceHtml: string): string {
  if (hasContractorSignatureBlock(sourceHtml)) {
    return sourceHtml;
  }
  if (/\{contractor_signature\}/i.test(sourceHtml)) {
    return sourceHtml.replace(/\{contractor_signature\}/i, SIGNATURE_BLOCK_HTML);
  }
  return insertSignatureInContractorCell(sourceHtml);
}
