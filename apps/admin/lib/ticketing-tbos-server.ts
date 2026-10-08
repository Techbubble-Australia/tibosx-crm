import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";

function ticketingApiBase(): string {
  const raw = process.env.TICKETING_API_URL?.trim();
  if (!raw) throw new Error("TICKETING_API_URL is not configured on admin");
  return raw.replace(/\/$/, "");
}

export async function ticketingTbosFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${ticketingApiBase()}/api/tbos${path}`, { ...init, headers });
}
