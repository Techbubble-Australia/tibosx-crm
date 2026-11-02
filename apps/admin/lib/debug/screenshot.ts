import type { ElementDiagnostics } from "@/lib/debug/css-selector";

function isDebugOverlayElement(element: Element): boolean {
  return Boolean(element.closest("[data-debug-ui]"));
}

function captureScale(): number {
  return Math.min(2, window.devicePixelRatio || 1);
}

/** Renders the visible viewport (debug UI excluded) — matches what the user sees on screen. */
async function captureViewportCanvas(): Promise<HTMLCanvasElement | null> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const scale = captureScale();
    return await html2canvas(document.documentElement, {
      backgroundColor: "#ffffff",
      scale,
      logging: false,
      useCORS: true,
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      ignoreElements: isDebugOverlayElement,
    });
  } catch {
    return null;
  }
}

function drawElementHighlight(canvas: HTMLCanvasElement, el: HTMLElement): void {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const scale = captureScale();
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const x = rect.left * scale;
  const y = rect.top * scale;
  const w = rect.width * scale;
  const h = rect.height * scale;

  ctx.save();
  ctx.fillStyle = "rgba(14, 165, 233, 0.12)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = Math.max(2, 2 * scale);
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  ctx.restore();
}

/** Visible viewport screenshot (excludes debug toolbar / modals). */
export async function captureViewportScreenshot(): Promise<string | null> {
  const canvas = await captureViewportCanvas();
  return canvas?.toDataURL("image/png") ?? null;
}

/**
 * Full viewport capture with the inspected element outlined — avoids cropping, which
 * mis-renders flex buttons/links (bold text, wrong padding) when html2canvas isolates pixels.
 */
export async function captureElementScreenshot(el: HTMLElement): Promise<string | null> {
  const canvas = await captureViewportCanvas();
  if (!canvas) return null;
  drawElementHighlight(canvas, el);
  return canvas.toDataURL("image/png");
}

export async function captureViewportScreenshotWithElementHighlight(
  el: HTMLElement | null | undefined,
): Promise<string | null> {
  const canvas = await captureViewportCanvas();
  if (!canvas) return null;
  if (el) drawElementHighlight(canvas, el);
  return canvas.toDataURL("image/png");
}

export function captureViewportDiagnostics(): ElementDiagnostics {
  return {
    tagName: "VIEWPORT",
    id: null,
    className: null,
    cssSelector: "viewport",
    innerText: typeof document.title === "string" ? document.title : null,
    boundingRect: {
      top: 0,
      left: 0,
      width: Math.round(window.innerWidth),
      height: Math.round(window.innerHeight),
    },
    captureScope: "viewport",
  };
}

/** Resolve element from diagnostics for recapture (best-effort). */
export function resolveElementFromDiagnostics(diagnostics: ElementDiagnostics): HTMLElement | null {
  if (diagnostics.captureScope === "viewport" || !diagnostics.cssSelector) return null;
  try {
    const node = document.querySelector(diagnostics.cssSelector);
    return node instanceof HTMLElement ? node : null;
  } catch {
    return null;
  }
}
