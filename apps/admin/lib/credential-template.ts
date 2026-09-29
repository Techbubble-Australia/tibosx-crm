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
