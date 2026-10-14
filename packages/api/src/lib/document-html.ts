import mammoth from "mammoth";
import { cleanPlaceholdersInHtml } from "./credential-template-vars";
import { wrapTemplateHtml } from "./credential-template-render";

const MAMMOTH_STYLE_MAP = [
  "p[style-name='Title'] => h1.docx-agreement-title:fresh",
  "p[style-name='Subtitle'] => p.docx-subtitle:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2.docx-section-title:fresh",
  "p[style-name='Heading 3'] => h3.docx-subsection-title:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "r[style-name='Strong'] => strong",
  "table => table.docx-table:fresh",
  "tr => tr:fresh",
  "td => td:fresh",
  "th => th:fresh",
];

export async function convertDocxBufferToHtml(buffer: Buffer): Promise<string> {
  const imageCounter = { value: 0 };
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: MAMMOTH_STYLE_MAP,
      includeDefaultStyleMap: true,
      ignoreEmptyParagraphs: false,
      convertImage: mammoth.images.imgElement((image) =>
        image.read("base64").then((imageBuffer) => {
          imageCounter.value += 1;
          return {
            src: `data:${image.contentType};base64,${imageBuffer}`,
            class: imageCounter.value === 1 ? "docx-logo" : "docx-inline-image",
          };
        }),
      ),
    },
  );
  if (result.messages.length > 0) {
    console.info(
      "DOCX import notes:",
      result.messages.map((message) => message.message).join("; "),
    );
  }
  return enhanceImportedHtml(result.value.trim());
}

function fixCommonTemplateTypos(html: string): string {
  return html.replace(/\bPostion\b/gi, "Position");
}

function enhanceImportedHtml(html: string): string {
  let next = fixCommonTemplateTypos(html);
  next = cleanPlaceholdersInHtml(next);
  next = next
    .replace(/<table(?![^>]*class=)/g, '<table class="docx-table"')
    .replace(/<td(?![^>]*valign=)/g, '<td valign="top"')
    .replace(/<th(?![^>]*valign=)/g, '<th valign="top"')
    .replace(/<td([^>]*)><p>/g, "<td$1>")
    .replace(/<\/p><\/td>/g, "</td>")
    .replace(/<th([^>]*)><p>/g, "<th$1>")
    .replace(/<\/p><\/th>/g, "</th>");

  next = promoteAgreementTitle(next);
  next = promoteSectionTitles(next);
  next = promoteSubsectionTitles(next);
  next = styleItemDetailsTables(next);
  next = fixCommonTemplateTypos(next);
  next = reconstructSectionTables(next);
  next = normalizeBulletParagraphs(next);
  return next;
}

/** Word list items often import as plain paragraphs; restore visible bullets in the editor. */
function normalizeBulletParagraphs(html: string): string {
  const bulletLead =
    /^(?:&bull;|&#8226;|&#9679;|•|\u2022|\u00b7)\s+|<span[^>]*>\s*(?:&bull;|&#8226;|•|\u2022)\s*<\/span>\s*/i;
  const numberedLead = /^(\d+\.)\s+/;

  let next = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (full, _attrs, inner) => {
    const trimmed = inner.trim();
    if (bulletLead.test(trimmed)) {
      const text = trimmed.replace(bulletLead, "").trim();
      if (!text) return full;
      return `<li class="docx-list-item">${text}</li>`;
    }
    if (numberedLead.test(trimmed)) {
      const text = trimmed.replace(numberedLead, "").trim();
      if (!text) return full;
      return `<li class="docx-list-item docx-list-item--numbered">${text}</li>`;
    }
    return full;
  });

  next = next.replace(
    /(?:<li class="docx-list-item(?! docx-list-item--numbered)[^>]*>[\s\S]*?<\/li>\s*)+/gi,
    (block) => `<ul class="docx-bullet-list">${block}</ul>`,
  );
  next = next.replace(
    /(?:<li class="docx-list-item docx-list-item--numbered"[^>]*>[\s\S]*?<\/li>\s*)+/gi,
    (block) => `<ol class="docx-numbered-list">${block.replace(/ docx-list-item--numbered/g, "")}</ol>`,
  );

  return next;
}

function promoteAgreementTitle(html: string): string {
  return html
    .replace(
      /<p[^>]*>(?:<strong>)?(TECHBUBBLE PTY LTD\s*[—–-]\s*Contractor Services Agreement)(?:<\/strong>)?<\/p>/i,
      '<h1 class="docx-agreement-title">$1</h1>',
    )
    .replace(
      /<h1(?![^>]*class=)[^>]*>(TECHBUBBLE PTY LTD\s*[—–-]\s*Contractor Services Agreement)<\/h1>/i,
      '<h1 class="docx-agreement-title">$1</h1>',
    );
}

function promoteSectionTitles(html: string): string {
  return html.replace(
    /<p[^>]*>\s*<strong>\s*(Part\s+[A-C]\s*[—–-]\s*[^<]+?)<\/strong>\s*<\/p>/gi,
    '<h2 class="docx-section-title">$1</h2>',
  );
}

function promoteSubsectionTitles(html: string): string {
  return html.replace(
    /<p[^>]*>\s*<strong>\s*(Contractor details|Assignment details)\s*<\/strong>\s*<\/p>/gi,
    '<h3 class="docx-subsection-title">$1</h3>',
  );
}

function styleItemDetailsTables(html: string): string {
  return html.replace(/<table class="docx-table([^"]*)">([\s\S]*?)<\/table>/gi, (full, extraClass, inner) => {
    if (!/\bItem\b/i.test(inner) || !/\bDetails\b/i.test(inner)) {
      return full;
    }

    let body = inner.trim();
    const headerRow =
      /<tr>\s*<t([dh])([^>]*)>\s*Item\s*<\/t\1>\s*<t([dh])([^>]*)>\s*Details\s*<\/t\3>\s*<\/tr>/i;
    if (headerRow.test(body) && !/<thead/i.test(body)) {
      body = body.replace(
        headerRow,
        "<thead><tr><th$2>Item</th><th$4>Details</th></tr></thead><tbody>",
      );
      if (!body.includes("</tbody>")) {
        body = `${body}</tbody>`;
      }
    } else if (!/<thead/i.test(body)) {
      body = `<thead><tr><th valign="top">Item</th><th valign="top">Details</th></tr></thead><tbody>${body}</tbody>`;
    }

    const className = `docx-table docx-details-table${extraClass ?? ""}`.trim();
    return `<table class="${className}">${body}</table>`;
  });
}

function reconstructSectionTables(html: string): string {
  const sectionTitles = ["Contractor details", "Assignment details"];
  let output = html;

  for (const title of sectionTitles) {
    const sectionPattern = new RegExp(
      `(<h3[^>]*class="docx-subsection-title"[^>]*>\\s*${escapeRegExp(title)}\\s*<\\/h3>|<h[1-6][^>]*>\\s*${escapeRegExp(title)}\\s*<\\/h[1-6]>|<p[^>]*>\\s*<strong>\\s*${escapeRegExp(title)}\\s*<\\/strong>\\s*<\\/p>|<p[^>]*>\\s*${escapeRegExp(title)}\\s*<\\/p>)`,
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

  return `<table class="docx-table docx-details-table"><thead><tr><th valign="top">Item</th><th valign="top">Details</th></tr></thead><tbody>${body}</tbody></table>`;
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
    return ext === "txt" ? `<pre>${raw}</pre>` : enhanceImportedHtml(raw);
  }
  throw new Error("Unsupported file type. Use .docx, .html, .htm, or .txt");
}

export function polishTemplateHtml(html: string): string {
  return enhanceImportedHtml(html);
}

export function previewImportedHtml(html: string): string {
  return wrapTemplateHtml(html);
}
