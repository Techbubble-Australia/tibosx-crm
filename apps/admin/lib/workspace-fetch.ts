import { adminFetch } from "@/lib/admin-api";

/** Support workspace APIs (client / customer support) via TBOS session. */
export function workspaceFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return adminFetch(`/api/admin/workspace${normalized}`, init);
}
