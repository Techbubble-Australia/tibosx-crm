import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import { adminSessionCookieOptions } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const apiUrl = process.env.API_URL || "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/auth/login`, {
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

  if (data?.data?.requiresMfa && typeof data?.data?.mfaToken === "string") {
    return NextResponse.json({
      requiresMfa: true,
      mfaToken: data.data.mfaToken,
      user: data.data.user,
    });
  }

  if (data?.data?.requiresPasswordReset && typeof data?.data?.token === "string") {
    const response = NextResponse.json({
      requiresPasswordReset: true,
      user: data.data.user,
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, data.data.token, adminSessionCookieOptions());
    return response;
  }

  if (data?.data?.requiresMfaSetup && typeof data?.data?.token === "string") {
    const response = NextResponse.json({
      requiresMfaSetup: true,
      user: data.data.user,
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, data.data.token, adminSessionCookieOptions());
    return response;
  }

  const token = data?.data?.token;
  if (typeof token !== "string") {
    return NextResponse.json({ error: "Invalid login response" }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true, user: data.data.user });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  return response;
}
