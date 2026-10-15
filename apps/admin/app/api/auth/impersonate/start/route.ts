import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import { adminSessionCookieOptions } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiUrl = process.env.API_URL || "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/auth/impersonate/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `${ADMIN_SESSION_COOKIE}=${token}`,
    },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: typeof data.error === "string" ? data.error : "Impersonation failed" },
      { status: res.status },
    );
  }
  const newToken = data?.data?.token;
  if (typeof newToken !== "string") {
    return NextResponse.json({ error: "Invalid response" }, { status: 502 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, newToken, adminSessionCookieOptions());
  return response;
}
