import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";

export async function GET() {
  const portalUrl = (process.env.NEXT_PUBLIC_TICKETING_PORTAL_URL || "http://localhost:3004").replace(/\/$/, "");
  const ticketingApi = (process.env.TICKETING_API_URL || "http://127.0.0.1:3003").replace(/\/$/, "");

  const tbosToken = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!tbosToken) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002"));
  }

  const ssoRes = await fetch(`${ticketingApi}/api/auth/tbos-sso`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tbosToken}`,
    },
    body: JSON.stringify({ tbosToken }),
  });

  const data = await ssoRes.json().catch(() => ({}));
  if (!ssoRes.ok) {
    const message = typeof data.error === "string" ? data.error : "Support portal SSO failed";
    return NextResponse.json({ error: message }, { status: ssoRes.status });
  }

  const token = data?.data?.token;
  if (typeof token !== "string") {
    return NextResponse.json({ error: "Invalid SSO response" }, { status: 502 });
  }

  const redirectUrl = `${portalUrl}/auth/consultant?token=${encodeURIComponent(token)}`;
  return NextResponse.redirect(redirectUrl);
}
