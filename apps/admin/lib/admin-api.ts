/** Admin UI calls the Next.js app (rewrites proxy /api/* to the API). Session is an httpOnly cookie. */
import { recordAdminFetchResponse } from "@/lib/debug/api-traffic-log";

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestInit: RequestInit = { ...init, credentials: "include" };
  const method = (requestInit.method ?? "GET").toUpperCase();
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input instanceof Request
          ? input.url
          : String(input);

  const started = typeof performance !== "undefined" ? performance.now() : 0;

  async function logResponse(res: Response): Promise<Response> {
    if (typeof window !== "undefined" && started > 0) {
      const latencyMs = Math.round((performance.now() - started) * 10) / 10;
      void recordAdminFetchResponse(url, method, res.status, latencyMs, res);
    }
    return res;
  }

  const res = await fetch(input, requestInit);
  if (res.status !== 401) return logResponse(res);

  if (url.includes("/api/auth/")) return logResponse(res);

  const refreshed = await fetch("/api/auth/session", { method: "GET", credentials: "include" });
  if (!refreshed.ok) return logResponse(res);
  const retry = await fetch(input, requestInit);
  return logResponse(retry);
}
