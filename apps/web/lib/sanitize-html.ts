/**
 * Basic HTML sanitization for job descriptions rendered on the public site.
 * Strips scripts, iframes, and event handlers.
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4",
  "ul", "ol", "li", "a", "span", "div",
]);

export function sanitizeJobHtml(html: string): string {
  if (!html?.trim()) return "";

  let out = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  out = out.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) => {
    const t = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(t)) return "";
    if (match.startsWith("</")) return `</${t}>`;
    if (t === "a") {
      const hrefMatch = match.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? "#";
      if (/^https?:\/\//i.test(href) || href.startsWith("/") || href.startsWith("#")) {
        return `<a href="${href.replace(/"/g, "&quot;")}" rel="noopener noreferrer" target="_blank">`;
      }
      return "<a>";
    }
    return `<${t}>`;
  });

  return out;
}

export function isHtmlContent(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}
