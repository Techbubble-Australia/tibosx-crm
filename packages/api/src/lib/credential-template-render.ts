import type { CredentialTemplateVariable } from "./credential-template-vars";
import { DOCUMENT_TEMPLATE_STYLES } from "./document-template-styles";

export const SIGNATURE_BLOCK_MARKER = "data-signature-block";

export const SIGNATURE_BLOCK_HTML = `<div ${SIGNATURE_BLOCK_MARKER}="contractor" class="signature-block" contenteditable="false">
<p><strong>Signature</strong></p>
<div data-signature-capture="contractor" class="signature-capture-area"></div>
</div>`;

const TEMPLATE_PREVIEW_STYLES = `${DOCUMENT_TEMPLATE_STYLES}
.signature-drag-handle, .signature-resize-handle, .table-width-resize-grip, .table-col-resize-grip { display: none !important; }
`;

export function listSignatureCaptureIds(html: string): string[] {
  const ids: string[] = [];
  const re = /data-signature-capture="([^"]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const id = match[1]?.trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function wrapTemplateHtml(body: string): string {
  const content = body.trim();
  if (!content) return "";
  if (content.toLowerCase().includes("<html")) return content;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${TEMPLATE_PREVIEW_STYLES}</style></head><body>${content}</body></html>`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replace the full contents of a signature capture div (handles nested divs in template HTML). */
function replaceSignatureCaptureDiv(html: string, captureId: string, innerHtml: string): string {
  const marker = `data-signature-capture="${captureId}"`;
  let searchFrom = 0;

  while (searchFrom < html.length) {
    const markerIndex = html.indexOf(marker, searchFrom);
    if (markerIndex === -1) return html;

    const divStart = html.lastIndexOf("<div", markerIndex);
    if (divStart === -1) return html;

    const openTagEnd = html.indexOf(">", divStart);
    if (openTagEnd === -1) return html;

    let depth = 0;
    let i = divStart;
    let replaced = false;

    while (i < html.length) {
      const slice = html.slice(i);
      const openMatch = slice.match(/^<div\b/i);
      const closeMatch = slice.match(/^<\/div>/i);

      if (openMatch) {
        depth += 1;
        i += openMatch[0].length;
        continue;
      }
      if (closeMatch) {
        depth -= 1;
        i += closeMatch[0].length;
        if (depth === 0) {
          const openTag = html.slice(divStart, openTagEnd + 1);
          html = html.slice(0, divStart) + openTag + innerHtml + html.slice(i);
          searchFrom = divStart + openTag.length + innerHtml.length;
          replaced = true;
          break;
        }
        continue;
      }
      i += 1;
    }

    if (!replaced) return html;
  }

  return html;
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
    const signedDate = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const signatureImg = `<img src="${signatureDataUrl}" alt="Signature" style="max-height:80px;display:block;" /><p style="font-size:11px;color:#444;margin:6px 0 0;">Signed on ${signedDate}</p>`;
    for (const captureId of listSignatureCaptureIds(rendered)) {
      rendered = replaceSignatureCaptureDiv(rendered, captureId, signatureImg);
    }
  }

  return rendered;
}

export function renderTemplateHtmlWithSignatures(
  html: string,
  values: Record<string, string>,
  variables: CredentialTemplateVariable[] = [],
  signaturesByCaptureId: Record<string, string> = {},
): string {
  let rendered = renderTemplateHtml(html, values, variables, null);
  const signedDate = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  for (const [captureId, dataUrl] of Object.entries(signaturesByCaptureId)) {
    if (!dataUrl.startsWith("data:image/")) continue;
    const signatureImg = `<img src="${dataUrl}" alt="Signature" style="max-height:80px;display:block;" /><p style="font-size:11px;color:#444;margin:6px 0 0;">Signed on ${signedDate}</p>`;
    rendered = replaceSignatureCaptureDiv(rendered, captureId, signatureImg);
    rendered = rendered.replace(new RegExp(`\\{Date\\}`, "gi"), signedDate);
  }

  return rendered;
}
