/** Admin UI calls the Next.js app (rewrites proxy /api/* to the API). Session is an httpOnly cookie. */
export function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, credentials: "include" });
}
