import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.currentPassword !== "string" ||
    typeof body.newPassword !== "string"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const apiUrl = process.env.API_URL || "http://localhost:3001";
  const cookieHeader = req.headers.get("cookie") ?? "";

  const res = await fetch(`${apiUrl}/api/auth/password/change-required`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: typeof data.error === "string" ? data.error : "Password update failed" },
      { status: res.status },
    );
  }

  const token = data?.data?.token;
  const response = NextResponse.json({
    ok: true,
    requiresMfaSetup: Boolean(data?.data?.requiresMfaSetup),
    user: data?.data?.user,
  });

  if (typeof token === "string") {
    response.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
  }

  return response;
}
