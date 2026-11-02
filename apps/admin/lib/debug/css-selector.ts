const MAX_DEPTH = 12;
const MAX_CLASSES = 3;

function escapeCssIdent(value: string): string {
  if (typeof CSS !== "undefined" && "escape" in CSS) {
    return CSS.escape(value);
  }
  return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

function segmentForElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) {
    return `${tag}#${escapeCssIdent(el.id)}`;
  }
  const classList = Array.from(el.classList)
    .filter(Boolean)
    .slice(0, MAX_CLASSES)
    .map((c) => `.${escapeCssIdent(c)}`)
    .join("");
  const parent = el.parentElement;
  if (!parent) return tag + classList;
  const siblings = Array.from(parent.children).filter((node) => node.tagName === el.tagName);
  const index = siblings.indexOf(el as Element) + 1;
  return `${tag}${classList}:nth-of-type(${index})`;
}

/** Build a CSS selector path from `el` up to `document.body`. */
export function buildCssSelectorPath(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  let depth = 0;
  while (current && current !== document.documentElement && depth < MAX_DEPTH) {
    parts.unshift(segmentForElement(current));
    if (current.id) break;
    current = current.parentElement;
    depth += 1;
  }
  return parts.join(" > ");
}

export type ElementDiagnostics = {
  tagName: string;
  id: string | null;
  className: string | null;
  cssSelector: string;
  innerText: string | null;
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  captureScope?: "element" | "viewport";
};

export function captureElementDiagnostics(el: Element): ElementDiagnostics {
  const rect = el.getBoundingClientRect();
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  return {
    tagName: el.tagName,
    id: el.id || null,
    className: typeof el.className === "string" && el.className.trim() ? el.className.trim() : null,
    cssSelector: buildCssSelectorPath(el),
    innerText: text ? text.slice(0, 500) : null,
    boundingRect: {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    captureScope: "element",
  };
}

/** Prefer the interactive control when the click target is an icon or text inside a link/button. */
export function resolveCaptureTarget(el: Element): HTMLElement {
  const control = el.closest("a, button");
  if (control instanceof HTMLElement) return control;
  return el instanceof HTMLElement ? el : (el.parentElement as HTMLElement);
}
