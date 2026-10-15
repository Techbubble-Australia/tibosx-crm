import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshAdminSessionToken } from "@/lib/admin-session-token";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import { adminSessionCookieOptions } from "@/lib/session";

/** Sliding session: extend cookie/JWT lifetime while the user is still active. */
export async function GET() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = process.env.API_URL || "http://localhost:3001";
  let refreshed: string | null = null;

  try {
    const fullRes = await fetch(`${apiUrl}/api/auth/refresh-full-session`, {
      method: "POST",
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
    });
    if (fullRes.ok) {
      const data = await fullRes.json();
      if (typeof data?.data?.token === "string") {
        refreshed = data.data.token;
      }
    }
  } catch {
    // fall through to local refresh
  }

  if (!refreshed) {
    refreshed = await refreshAdminSessionToken(token);
  }
  if (!refreshed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, refreshed, adminSessionCookieOptions());
  return response;
}
