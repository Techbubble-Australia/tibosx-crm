/**
 * Base URL for server-side requests to the Express API.
 * Prefer API_URL (not exposed to the browser). Next rewrites proxy /api/* for same-origin fetches.
 */
export function getServerApiBaseUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}
