/** Extract editable body HTML from stored template (with or without data-template-canvas wrapper). */
export function extractTemplateEditorContent(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "<p></p>";
  const match = trimmed.match(/<div[^>]*data-template-canvas[^>]*>([\s\S]*)<\/div>\s*$/i);
  if (match?.[1]) return match[1].trim() || "<p></p>";
  return trimmed;
}

export function wrapTemplateEditorContent(innerHtml: string): string {
  const body = innerHtml.trim() || "<p></p>";
  if (body.includes('data-template-canvas="true"')) return body;
  return `<div data-template-canvas="true" class="template-canvas">${body}</div>`;
}
