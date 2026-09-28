import mammoth from "mammoth";
import { wrapTemplateHtml } from "./credential-template-render";

const MAMMOTH_STYLE_MAP = [
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='List Paragraph'] => p:fresh",
  "r[style-name='Strong'] => strong",
];

export async function convertDocxBufferToHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: MAMMOTH_STYLE_MAP,
      includeDefaultStyleMap: true,
    },
  );
  return enhanceImportedHtml(result.value.trim());
}

function enhanceImportedHtml(html: string): string {
  return html
    .replace(/<table>/g, '<table class="docx-table">')
    .replace(/<td>/g, '<td valign="top">')
    .replace(/<th>/g, '<th valign="top">');
}

export function readTextOrHtmlBuffer(buffer: Buffer, filename: string): string {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "html" || ext === "htm") {
    return buffer.toString("utf8");
  }
  return buffer.toString("utf8");
}

export async function importDocumentToHtml(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "docx") {
    return convertDocxBufferToHtml(buffer);
  }
  if (ext === "html" || ext === "htm" || ext === "txt") {
    const raw = readTextOrHtmlBuffer(buffer, filename);
    return ext === "txt" ? `<pre>${raw}</pre>` : raw;
  }
  throw new Error("Unsupported file type. Use .docx, .html, .htm, or .txt");
}

export function previewImportedHtml(html: string): string {
  return wrapTemplateHtml(html);
}
