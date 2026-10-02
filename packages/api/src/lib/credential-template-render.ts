import type { CredentialTemplateVariable } from "./credential-template-vars";
import { DOCUMENT_TEMPLATE_STYLES } from "./document-template-styles";

export const SIGNATURE_BLOCK_MARKER = "data-signature-block";

export const SIGNATURE_BLOCK_HTML = `<div ${SIGNATURE_BLOCK_MARKER}="contractor" class="signature-block" contenteditable="false">
<p><strong>Contractor signature</strong></p>
<div data-signature-capture="contractor" class="signature-capture-area"></div>
<p class="signature-hint">The contractor will sign here in the agreement portal.</p>
</div>`;

const TEMPLATE_PREVIEW_STYLES = `${DOCUMENT_TEMPLATE_STYLES}
.signature-drag-handle, .signature-resize-handle, .table-width-resize-grip, .table-col-resize-grip { display: none !important; }
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
