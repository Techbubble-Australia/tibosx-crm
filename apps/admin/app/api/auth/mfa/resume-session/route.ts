import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import { adminSessionCookieOptions } from "@/lib/session";

export async function POST(req: Request) {
  const apiUrl = process.env.API_URL || "http://localhost:3001";
  const cookie = req.headers.get("cookie") ?? "";

  const res = await fetch(`${apiUrl}/api/auth/mfa/resume-session`, {
    method: "POST",
    headers: { cookie },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: typeof data.error === "string" ? data.error : "Failed to resume session" },
      { status: res.status },
    );
  }

  const token = data?.data?.token;
  if (typeof token !== "string") {
    return NextResponse.json({ error: "Invalid resume session response" }, { status: 502 });
  }

  const response = NextResponse.json({
    ok: true,
    user: data.data.user,
  });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  return response;
}
