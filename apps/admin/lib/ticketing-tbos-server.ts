import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import { supportApiBase } from "@/lib/support-api-base";

export async function ticketingTbosFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (init?.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${supportApiBase()}/api/admin/ticketing${path}`, { ...init, headers });
}
