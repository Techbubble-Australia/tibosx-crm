import mammoth from "mammoth";
import { cleanPlaceholdersInHtml } from "./credential-template-vars";
import { wrapTemplateHtml } from "./credential-template-render";

const MAMMOTH_STYLE_MAP = [
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='List Paragraph'] => p:fresh",
  "r[style-name='Strong'] => strong",
  "table => table.docx-table:fresh",
  "tr => tr:fresh",
  "td => td:fresh",
  "th => th:fresh",
];

export async function convertDocxBufferToHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: MAMMOTH_STYLE_MAP,
      includeDefaultStyleMap: true,
      ignoreEmptyParagraphs: false,
    },
  );
  return enhanceImportedHtml(result.value.trim());
}

function enhanceImportedHtml(html: string): string {
  let next = cleanPlaceholdersInHtml(html)
    .replace(/<table(?![^>]*class=)/g, '<table class="docx-table"')
    .replace(/<table class="docx-table"(?![^>]*class=)/g, '<table class="docx-table"')
    .replace(/<td(?![^>]*valign=)/g, '<td valign="top"')
    .replace(/<th(?![^>]*valign=)/g, '<th valign="top"')
    .replace(/<td([^>]*)><p>/g, "<td$1>")
    .replace(/<\/p><\/td>/g, "</td>")
    .replace(/<th([^>]*)><p>/g, "<th$1>")
    .replace(/<\/p><\/th>/g, "</th>");

  next = reconstructSectionTables(next);
  return next;
}

function reconstructSectionTables(html: string): string {
  const sectionTitles = ["Contractor details", "Assignment details"];
  let output = html;

  for (const title of sectionTitles) {
    const sectionPattern = new RegExp(
      `(<h[1-6][^>]*>\\s*${escapeRegExp(title)}\\s*<\\/h[1-6]>|<p[^>]*>\\s*<strong>\\s*${escapeRegExp(title)}\\s*<\\/strong>\\s*<\\/p>|<p[^>]*>\\s*${escapeRegExp(title)}\\s*<\\/p>)`,
      "i",
    );
    const match = sectionPattern.exec(output);
    if (!match || match.index === undefined) continue;

    const sectionStart = match.index + match[0].length;
    const nextHeading = output.slice(sectionStart).search(/<h[1-6][^>]*>/i);
    const sectionEnd = nextHeading === -1 ? output.length : sectionStart + nextHeading;
    const sectionHtml = output.slice(sectionStart, sectionEnd);
    if (/<table\b/i.test(sectionHtml)) continue;

    const rebuilt = buildItemDetailsTable(sectionHtml);
    if (!rebuilt) continue;

    output = `${output.slice(0, sectionStart)}${rebuilt}${output.slice(sectionEnd)}`;
  }

  return output;
}

function buildItemDetailsTable(sectionHtml: string): string | null {
  const rows = extractItemDetailRows(sectionHtml);
  if (rows.length < 2) return null;

  const body = rows
    .map(
      ([item, details]) =>
        `<tr><td valign="top">${item}</td><td valign="top">${details}</td></tr>`,
    )
    .join("");

  return `<table class="docx-table"><thead><tr><th valign="top">Item</th><th valign="top">Details</th></tr></thead><tbody>${body}</tbody></table>`;
}

function extractItemDetailRows(sectionHtml: string): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const paragraphMatches = [
    ...sectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi),
    ...sectionHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi),
  ];

  const lines = paragraphMatches
    .map((match) => normalizeInlineHtml(match[1] ?? ""))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (lines.length === 0) return rows;

  const startIndex =
    lines[0]?.toLowerCase() === "item" && lines[1]?.toLowerCase() === "details" ? 2 : 0;

  for (let index = startIndex; index < lines.length; index += 2) {
    const item = lines[index];
    const details = lines[index + 1];
    if (!item || !details) break;
    if (/^item$/i.test(item) && /^details$/i.test(details)) continue;
    rows.push([item, details]);
  }

  return rows;
}

function normalizeInlineHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
