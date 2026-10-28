import type { ElementDiagnostics } from "@/lib/debug/css-selector";

function isDebugOverlayElement(element: Element): boolean {
  return Boolean(element.closest("[data-debug-ui]"));
}

/** Visible viewport screenshot (excludes debug toolbar / modals). */
export async function captureViewportScreenshot(): Promise<string | null> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(document.documentElement, {
      backgroundColor: "#ffffff",
      scale: Math.min(2, window.devicePixelRatio || 1),
      logging: false,
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      ignoreElements: isDebugOverlayElement,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function captureElementScreenshot(el: HTMLElement): Promise<string | null> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 1,
      logging: false,
      ignoreElements: isDebugOverlayElement,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
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
