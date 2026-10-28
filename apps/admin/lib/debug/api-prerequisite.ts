import { adminFetch } from "@/lib/admin-api";
import { inferApiPrerequisiteFromTraffic, type TrafficInferenceReason } from "@/lib/debug/api-traffic-log";

export type ApiPrerequisiteCapture = {
  endpoint: string;
  method: string;
  status: number | null;
  latencyMs: number;
  payloadCaptured: unknown;
  /** How this block was resolved (for the debug ticket UI). */
  captureSource?: "dom" | "traffic_log";
  trafficMatchReason?: TrafficInferenceReason;
};

async function probeEndpoint(
  endpoint: string,
  method: string,
  bodyRaw: string | null,
): Promise<Omit<ApiPrerequisiteCapture, "captureSource">> {
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

/**
 * Resolves API context for a debug capture:
 * 1. `data-api-endpoint` on the element or an ancestor (re-fetches live).
 * 2. Otherwise, a recent successful `adminFetch` matched by element text/ids or list context.
 */
export async function captureApiPrerequisite(el: Element): Promise<ApiPrerequisiteCapture | null> {
  const host = el.closest("[data-api-endpoint]") as HTMLElement | null;
  if (host) {
    const endpoint = host.getAttribute("data-api-endpoint")?.trim();
    if (endpoint) {
      const method = (host.getAttribute("data-api-method") ?? "GET").trim().toUpperCase();
      const bodyRaw = host.getAttribute("data-api-body");
      const probed = await probeEndpoint(endpoint, method, bodyRaw);
      return { ...probed, captureSource: "dom" };
    }
  }

  const inferred = inferApiPrerequisiteFromTraffic(el);
  if (!inferred) return null;

  return {
    endpoint: inferred.entry.endpoint,
    method: inferred.entry.method,
    status: inferred.entry.status,
    latencyMs: inferred.entry.latencyMs,
    payloadCaptured: inferred.entry.payloadCaptured,
    captureSource: "traffic_log",
    trafficMatchReason: inferred.reason,
  };
}
