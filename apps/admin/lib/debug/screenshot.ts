import type { ElementDiagnostics } from "@/lib/debug/css-selector";

function isDebugOverlayElement(element: Element): boolean {
  return Boolean(element.closest("[data-debug-ui]"));
}

function captureScale(): number {
  return Math.min(2, window.devicePixelRatio || 1);
}

/** Renders the visible viewport (debug UI excluded) — matches what the user sees on screen. */
async function captureViewportCanvas(): Promise<HTMLCanvasElement | null> {
  // html2canvas scrolls its cloned page to the current position; with the app's global
  // `scroll-behavior: smooth` that scroll is still animating when it renders, so the capture
  // (and every element crop) comes out shifted up the page whenever the user has scrolled.
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  try {
    const html2canvas = (await import("html2canvas")).default;
    const scale = captureScale();
    return await html2canvas(document.documentElement, {
      backgroundColor: "#ffffff",
      scale,
      logging: false,
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
  } finally {
    root.style.scrollBehavior = previousScrollBehavior;
  }
}

/** Visible viewport screenshot (excludes debug toolbar / modals). */
export async function captureViewportScreenshot(): Promise<string | null> {
  const canvas = await captureViewportCanvas();
  return canvas?.toDataURL("image/png") ?? null;
}

/**
 * Crops an element from the viewport capture instead of rendering the node alone.
 * html2canvas mis-draws flex-centered text on buttons when the subtree is isolated.
 */
export async function captureElementScreenshot(el: HTMLElement): Promise<string | null> {
  const canvas = await captureViewportCanvas();
  if (!canvas) return null;

  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const scale = captureScale();
  const sx = Math.max(0, Math.floor(rect.left * scale));
  const sy = Math.max(0, Math.floor(rect.top * scale));
  const sw = Math.min(Math.ceil(rect.width * scale), canvas.width - sx);
  const sh = Math.min(Math.ceil(rect.height * scale), canvas.height - sy);
  if (sw <= 0 || sh <= 0) return null;

  const cropped = document.createElement("canvas");
  cropped.width = sw;
  cropped.height = sh;
  const ctx = cropped.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return cropped.toDataURL("image/png");
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
