import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.mfaToken !== "string" || typeof body.code !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const apiUrl = process.env.API_URL || "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/auth/mfa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mfaToken: body.mfaToken, code: body.code }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: typeof data.error === "string" ? data.error : "MFA verification failed" },
      { status: res.status },
    );
  }

  const token = data?.data?.token;
  if (typeof token !== "string") {
    return NextResponse.json({ error: "Invalid MFA response" }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true, user: data.data.user });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
