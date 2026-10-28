import { adminFetch } from "@/lib/admin-api";

export type ApiPrerequisiteCapture = {
  endpoint: string;
  method: string;
  status: number | null;
  latencyMs: number;
  payloadCaptured: unknown;
};

/**
 * If `el` or an ancestor has `data-api-endpoint`, probe that URL (credentials included).
 * Optional: `data-api-method`, `data-api-body` (JSON string for POST/PUT/PATCH).
 */
export async function captureApiPrerequisite(el: Element): Promise<ApiPrerequisiteCapture | null> {
  const host = el.closest("[data-api-endpoint]") as HTMLElement | null;
  if (!host) return null;

  const endpoint = host.getAttribute("data-api-endpoint")?.trim();
  if (!endpoint) return null;

  const method = (host.getAttribute("data-api-method") ?? "GET").trim().toUpperCase();
  const bodyRaw = host.getAttribute("data-api-body");
  const started = performance.now();

  try {
    const init: RequestInit = {
      method,
      credentials: "include",
      headers: { Accept: "application/json" },
    };
    if (bodyRaw && method !== "GET" && method !== "HEAD") {
      init.headers = { ...init.headers, "Content-Type": "application/json" };
      init.body = bodyRaw;
    }

    const res = await adminFetch(endpoint.startsWith("/") ? endpoint : `/${endpoint}`, init);
    const latencyMs = Math.round((performance.now() - started) * 10) / 10;
    const text = await res.text();
    let payloadCaptured: unknown;
    try {
      payloadCaptured = text ? JSON.parse(text) : null;
    } catch {
      payloadCaptured = { rawText: text.slice(0, 8000), parseError: true };
    }
    return {
      endpoint,
      method,
      status: res.status,
      latencyMs,
      payloadCaptured,
    };
  } catch (error) {
    return {
      endpoint,
      method,
      status: null,
      latencyMs: Math.round((performance.now() - started) * 10) / 10,
      payloadCaptured: {
        error: error instanceof Error ? error.message : "Request failed",
      },
    };
  }
}
