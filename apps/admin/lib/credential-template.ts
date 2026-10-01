export const SIGNATURE_BLOCK_HTML = `<div data-signature-block="contractor" class="signature-block" contenteditable="false">
<p><strong>Contractor signature</strong></p>
<div data-signature-capture="contractor" class="signature-capture-area"></div>
<p class="signature-hint">The contractor will sign here in the agreement portal.</p>
</div>`;

const TEMPLATE_PREVIEW_STYLES = `
body { font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0; padding: 24px; }
table, table.docx-table { width: 100%; border-collapse: collapse; margin: 16px 0; table-layout: fixed; border: 1px solid #374151; }
td, th { border: 1px solid #374151; padding: 8px 10px; vertical-align: top; word-wrap: break-word; }
th { background: #f3f4f6; font-weight: 600; }
table td p, table th p { margin: 0; }
h1, h2, h3 { margin-top: 1.25em; margin-bottom: 0.5em; }
ul, ol { margin: 0.5em 0 0.5em 1.25em; }
.signature-block { border: 2px dashed #6b7280; padding: 16px; margin: 24px 0; background: #fafafa; }
table .signature-block { margin: 0; padding: 8px 6px; }
table .signature-capture-area { min-height: 64px; margin-top: 8px; }
.signature-capture-area { min-height: 80px; border-bottom: 1px solid #374151; margin-top: 16px; }
.signature-hint { margin-top: 8px; font-size: 11px; color: #6b7280; }
img { max-width: 100%; height: auto; }
`;

export function wrapTemplatePreviewHtml(body: string): string {
  const content = body.trim();
  if (!content) return "";
  if (content.toLowerCase().includes("<html")) return content;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${TEMPLATE_PREVIEW_STYLES}</style></head><body>${content}</body></html>`;
}

function cellText(cell: Element): string {
  return (cell.textContent ?? "").replace(/\s+/g, " ").trim();
}

function findContractorColumnIndex(table: HTMLTableElement): number {
  const rows = Array.from(table.querySelectorAll("tr"));
  for (const row of rows.slice(0, 4)) {
    const cells = Array.from(row.querySelectorAll("td, th"));
    const idx = cells.findIndex((cell) => /for\s+the\s+contractor/i.test(cellText(cell)));
    if (idx >= 0) return idx;
  }
  const tableText = table.textContent ?? "";
  if (/for\s+the\s+contractor/i.test(tableText)) {
    const firstRow = rows[0];
    if (firstRow) {
      const count = firstRow.querySelectorAll("td, th").length;
      if (count >= 2) return count - 1;
    }
  }
  return -1;
}

function findSignatureRow(table: HTMLTableElement): HTMLTableRowElement | null {
  for (const row of Array.from(table.querySelectorAll("tr"))) {
    const cells = Array.from(row.querySelectorAll("td, th"));
    const label = cellText(cells[0] ?? row);
    if (/^signature$/i.test(label) || /^signature\s*:/i.test(label)) {
      return row;
    }
  }
  return null;
}

/** True when the contractor signature block sits in the signature row of a signing table. */
export function isContractorSignatureInTable(html: string): boolean {
  if (typeof DOMParser === "undefined") return false;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const block = doc.querySelector('[data-signature-block="contractor"]');
  if (!block) return false;
  const table = block.closest("table");
  if (!table) return false;
  const row = block.closest("tr");
  if (!row || row !== findSignatureRow(table as HTMLTableElement)) return false;
  const contractorCol = findContractorColumnIndex(table as HTMLTableElement);
  if (contractorCol < 0) return false;
  const cells = Array.from(row.querySelectorAll("td, th"));
  return cells[contractorCol]?.contains(block) ?? false;
}

/**
 * Places the contractor signature block in the "For the Contractor" signature table cell.
 * Removes a duplicate block outside the table when relocating.
 */
export function insertSignatureBlockIntoContractorTable(html: string): string | null {
  if (typeof DOMParser === "undefined") return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  let existing = body.querySelector('[data-signature-block="contractor"]');
  const blockMarkup = existing ? existing.outerHTML : SIGNATURE_BLOCK_HTML;

  for (const table of Array.from(body.querySelectorAll("table"))) {
    const contractorCol = findContractorColumnIndex(table);
    if (contractorCol < 0) continue;

    const signatureRow = findSignatureRow(table);
    if (!signatureRow) continue;

    const cells = Array.from(signatureRow.querySelectorAll("td, th"));
    const target = cells[contractorCol];
    if (!target) continue;

    if (existing) existing.remove();
    target.innerHTML = blockMarkup;
    return body.innerHTML;
  }

  return null;
}

export function buildHtmlWithSignatureBlock(sourceHtml: string): string {
  if (isContractorSignatureInTable(sourceHtml)) {
    return sourceHtml;
  }

  const inTable = insertSignatureBlockIntoContractorTable(sourceHtml);
  if (inTable) return inTable;

  if (sourceHtml.includes('data-signature-block="contractor"')) {
    return sourceHtml;
  }

  if (/\{contractor_signature\}/i.test(sourceHtml)) {
    return sourceHtml.replace(/\{contractor_signature\}/i, SIGNATURE_BLOCK_HTML);
  }

  return `${sourceHtml.trim()}\n${SIGNATURE_BLOCK_HTML}`;
}
