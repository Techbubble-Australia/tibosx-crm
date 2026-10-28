import { NextResponse } from "next/server";
import { DEBUG_PORTAL_SESSION_COOKIE } from "@/lib/auth-cookie";
import { sessionCookieOptions } from "@/lib/session";
import { getUpstreamApiBase } from "@/lib/proxy-api-request";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const res = await fetch(`${getUpstreamApiBase()}/api/debug-portal/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: typeof data.error === "string" ? data.error : "Login failed" },
      { status: res.status },
    );
  }

  const token = data?.data?.token;
  if (typeof token !== "string") {
    return NextResponse.json({ error: "Invalid login response" }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true, user: data.data.user });
  response.cookies.set(DEBUG_PORTAL_SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
