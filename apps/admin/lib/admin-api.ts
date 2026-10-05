/** Admin UI calls the Next.js app (rewrites proxy /api/* to the API). Session is an httpOnly cookie. */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestInit: RequestInit = { ...init, credentials: "include" };
  const res = await fetch(input, requestInit);
  if (res.status !== 401) return res;

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input instanceof Request
          ? input.url
          : String(input);
  if (url.includes("/api/auth/")) return res;

  const refreshed = await fetch("/api/auth/session", { method: "GET", credentials: "include" });
  if (!refreshed.ok) return res;
  return fetch(input, requestInit);
}
