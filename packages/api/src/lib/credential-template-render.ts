import type { CredentialTemplateVariable } from "./credential-template-vars";

export const SIGNATURE_BLOCK_MARKER = "data-signature-block";

export const SIGNATURE_BLOCK_HTML = `<div ${SIGNATURE_BLOCK_MARKER}="contractor" class="signature-block" contenteditable="false">
<p><strong>Contractor signature</strong></p>
<div data-signature-capture="contractor" class="signature-capture-area"></div>
<p class="signature-hint">The contractor will sign here in the agreement portal.</p>
</div>`;

const TEMPLATE_PREVIEW_STYLES = `
.template-canvas { position: relative; min-height: 720px; }
body { font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 0; padding: 24px; }
table, table.docx-table { width: 100%; border-collapse: collapse; margin: 16px 0; table-layout: fixed; border: 1px solid #374151; }
td, th { border: 1px solid #374151; padding: 8px 10px; vertical-align: top; word-wrap: break-word; }
th { background: #f3f4f6; font-weight: 600; }
table td p, table th p { margin: 0; }
h1, h2, h3 { margin-top: 1.25em; margin-bottom: 0.5em; }
ul, ol { margin: 0.5em 0 0.5em 1.25em; }
.signature-block { border: 2px dashed #6b7280; padding: 12px; background: #fafafa; position: relative; }
.signature-block--flow { margin: 8px 0; }
td .signature-block--flow, th .signature-block--flow { margin: 6px 0; max-width: 100%; }
.signature-capture-area { min-height: 56px; border-bottom: 1px solid #374151; margin-top: 8px; }
.signature-hint { margin-top: 6px; font-size: 11px; color: #6b7280; }
.signature-drag-handle, .signature-resize-handle, .table-width-resize-grip, .table-col-resize-grip { display: none !important; }
img { max-width: 100%; height: auto; }
`;

export function wrapTemplateHtml(body: string): string {
  const content = body.trim();
  if (!content) return "";
  if (content.toLowerCase().includes("<html")) return content;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${TEMPLATE_PREVIEW_STYLES}</style></head><body>${content}</body></html>`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renderTemplateHtml(
  html: string,
  values: Record<string, string>,
  variables: CredentialTemplateVariable[] = [],
  signatureDataUrl?: string | null,
): string {
  let rendered = html;

  for (const variable of variables) {
    const value = values[variable.key] ?? "";
    const patterns = [variable.key, variable.label].filter(Boolean);
    for (const pattern of patterns) {
      rendered = rendered.replace(new RegExp(`\\{${escapeRegExp(pattern)}\\}`, "gi"), value);
      rendered = rendered.replace(new RegExp(`\\{${escapeRegExp(pattern)}\\]`, "gi"), value);
      rendered = rendered.replace(new RegExp(`\\[${escapeRegExp(pattern)}\\}`, "gi"), value);
    }
  }

  for (const [key, value] of Object.entries(values)) {
    rendered = rendered.replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, "gi"), value);
    rendered = rendered.replace(new RegExp(`\\{${escapeRegExp(key)}\\]`, "gi"), value);
    rendered = rendered.replace(new RegExp(`\\[${escapeRegExp(key)}\\}`, "gi"), value);
  }

  rendered = rendered.replace(/<button[^>]*data-signature-drag-handle[^>]*>[\s\S]*?<\/button>/gi, "");
  rendered = rendered.replace(/<span[^>]*data-signature-resize-handle[^>]*>\s*<\/span>/gi, "");
  rendered = rendered.replace(/<span[^>]*table-width-resize-grip[^>]*>\s*<\/span>/gi, "");
  rendered = rendered.replace(/<span[^>]*table-col-resize-grip[^>]*>\s*<\/span>/gi, "");

  if (signatureDataUrl) {
    const signatureImg = `<img src="${signatureDataUrl}" alt="Signature" style="max-height:80px;display:block;" />`;
    rendered = rendered.replace(
      /<div([^>]*data-signature-capture="contractor"[^>]*)><\/div>/gi,
      `<div$1>${signatureImg}</div>`,
    );
    rendered = rendered.replace(
      /<p class="signature-hint">[\s\S]*?<\/p>/gi,
      `<p class="signature-hint">Signed electronically.</p>`,
    );
  }

  return rendered;
}
