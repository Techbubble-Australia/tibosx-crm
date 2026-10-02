export const SIGNATURE_BLOCK_SELECTOR = '[data-signature-block="contractor"]';

export const DEFAULT_SIGNATURE_WIDTH_PX = 260;
export const DEFAULT_SIGNATURE_HEIGHT_PX = 120;

export const SIGNATURE_BLOCK_HTML = createSignatureBlockHtml({
  left: 48,
  top: 48,
  width: DEFAULT_SIGNATURE_WIDTH_PX,
  height: DEFAULT_SIGNATURE_HEIGHT_PX,
});

export function createSignatureBlockHtml(options: {
  left: number;
  top: number;
  width?: number;
  height?: number;
}): string {
  const width = options.width ?? DEFAULT_SIGNATURE_WIDTH_PX;
  const height = options.height ?? DEFAULT_SIGNATURE_HEIGHT_PX;
  return `<div data-signature-block="contractor" data-signature-layout="free" class="signature-block signature-block--free" contenteditable="false" style="position:absolute;left:${Math.round(options.left)}px;top:${Math.round(options.top)}px;width:${Math.round(width)}px;min-height:${Math.round(height)}px;z-index:30;box-sizing:border-box;">
<button type="button" data-signature-drag-handle class="signature-drag-handle" aria-label="Move signature block">Move</button>
<p><strong>Contractor signature</strong></p>
<div data-signature-capture="contractor" class="signature-capture-area"></div>
<p class="signature-hint">The contractor will sign here in the agreement portal.</p>
<span data-signature-resize-handle class="signature-resize-handle" aria-hidden="true"></span>
</div>`;
}

export const TEMPLATE_DOCUMENT_STYLES = `
.template-canvas { position: relative; min-height: 720px; }
body { font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0; padding: 24px; }
table, table.docx-table { width: 100%; border-collapse: collapse; margin: 16px 0; table-layout: fixed; border: 1px solid #374151; }
td, th { border: 1px solid #374151; padding: 8px 10px; vertical-align: top; word-wrap: break-word; }
th { background: #f3f4f6; font-weight: 600; }
table td p, table th p { margin: 0; }
h1, h2, h3 { margin-top: 1.25em; margin-bottom: 0.5em; }
ul, ol { margin: 0.5em 0 0.5em 1.25em; }
.signature-block { border: 2px dashed #6b7280; padding: 12px 12px 20px; background: #fafafa; }
.signature-block--free { margin: 0; }
.signature-capture-area { min-height: 56px; border-bottom: 1px solid #374151; margin-top: 8px; }
.signature-hint { margin-top: 6px; font-size: 11px; color: #6b7280; }
.signature-drag-handle { position: absolute; top: 4px; right: 4px; z-index: 2; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; padding: 2px 8px; font-size: 10px; font-family: system-ui, sans-serif; cursor: grab; color: #374151; }
.signature-drag-handle:active { cursor: grabbing; }
.signature-resize-handle { position: absolute; right: 2px; bottom: 2px; width: 12px; height: 12px; cursor: nwse-resize; background: linear-gradient(135deg, transparent 50%, #6b7280 50%); }
img { max-width: 100%; height: auto; }
`;

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

/** Normalize legacy flow/table blocks to free-positioned overlay on the canvas. */
export function normalizeSignatureBlockLayout(canvas: HTMLElement): void {
  const block = canvas.querySelector(SIGNATURE_BLOCK_SELECTOR);
  if (!(block instanceof HTMLElement)) return;

  const layout = block.getAttribute("data-signature-layout");
  const hasPosition = block.style.position === "absolute" && block.style.left && block.style.top;
  if (layout === "free" && hasPosition) return;

  const canvasRect = canvas.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  const left = Math.max(0, blockRect.left - canvasRect.left + canvas.scrollLeft);
  const top = Math.max(0, blockRect.top - canvasRect.top + canvas.scrollTop);
  const width = blockRect.width || DEFAULT_SIGNATURE_WIDTH_PX;
  const height = blockRect.height || DEFAULT_SIGNATURE_HEIGHT_PX;

  if (block.parentElement && block.parentElement !== canvas) {
    block.remove();
    canvas.appendChild(block);
  }

  block.setAttribute("data-signature-layout", "free");
  block.classList.add("signature-block--free");
  block.style.position = "absolute";
  block.style.left = `${Math.round(left)}px`;
  block.style.top = `${Math.round(top)}px`;
  block.style.width = `${Math.round(width)}px`;
  block.style.minHeight = `${Math.round(height)}px`;
  block.style.zIndex = "30";
  block.style.boxSizing = "border-box";
  block.style.margin = "0";

  ensureEditorChrome(block);
}

function ensureEditorChrome(block: HTMLElement): void {
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

export function placeSignatureBlockAt(html: string, left: number, top: number): string {
  const doc = parseTemplateDoc(html);
  const canvas = ensureTemplateCanvasOnDocument(doc);

  let block = canvas.querySelector(SIGNATURE_BLOCK_SELECTOR) as HTMLElement | null;
  if (!block) {
    canvas.insertAdjacentHTML("beforeend", createSignatureBlockHtml({ left, top }));
    block = canvas.querySelector(SIGNATURE_BLOCK_SELECTOR) as HTMLElement;
  }
  if (block) {
    if (block.parentElement !== canvas) {
      block.remove();
      canvas.appendChild(block);
    }
    block.setAttribute("data-signature-layout", "free");
    block.classList.add("signature-block--free");
    block.style.position = "absolute";
    block.style.left = `${Math.round(left)}px`;
    block.style.top = `${Math.round(top)}px`;
    block.style.zIndex = "30";
    block.style.boxSizing = "border-box";
    block.style.margin = "0";
    if (!block.style.width) block.style.width = `${DEFAULT_SIGNATURE_WIDTH_PX}px`;
    if (!block.style.minHeight) block.style.minHeight = `${DEFAULT_SIGNATURE_HEIGHT_PX}px`;
    ensureEditorChrome(block);
  }

  return doc.body.innerHTML;
}

export function serializeTemplateHtmlFromCanvas(canvas: HTMLElement): string {
  const root = canvas.closest("[data-template-canvas]") as HTMLElement | null;
  return root?.outerHTML ?? canvas.outerHTML;
}

export function buildHtmlWithSignatureBlock(sourceHtml: string): string {
  if (hasContractorSignatureBlock(sourceHtml)) {
    return sourceHtml;
  }
  if (/\{contractor_signature\}/i.test(sourceHtml)) {
    return sourceHtml.replace(/\{contractor_signature\}/i, SIGNATURE_BLOCK_HTML);
  }
  return placeSignatureBlockAt(sourceHtml, 48, 48);
}
