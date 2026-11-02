import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEBUG_PORTAL_SESSION_COOKIE } from "@/lib/auth-cookie";
import { debugPortalAbsoluteUrl } from "@/lib/public-origin";
import { sessionCookieOptions } from "@/lib/session";
import { getUpstreamApiBase } from "@/lib/proxy-api-request";

export async function GET(req: NextRequest) {
  const ssoToken = req.nextUrl.searchParams.get("token")?.trim();
  const reporterUserId = req.nextUrl.searchParams.get("reporterUserId")?.trim() ?? "";

  if (!ssoToken) {
    return NextResponse.redirect(debugPortalAbsoluteUrl(req, "/login?error=sso"));
  }

  const res = await fetch(`${getUpstreamApiBase()}/api/debug-portal/auth/exchange-sso`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ssoToken }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "SSO failed";
    const loginUrl = debugPortalAbsoluteUrl(req, "/login");
    loginUrl.searchParams.set("error", message.slice(0, 120));
    return NextResponse.redirect(loginUrl);
  }

  const token = data?.data?.token;
  if (typeof token !== "string") {
    return NextResponse.redirect(debugPortalAbsoluteUrl(req, "/login?error=sso"));
  }

  const ticketsUrl = debugPortalAbsoluteUrl(req, "/tickets");
  if (reporterUserId) {
    ticketsUrl.searchParams.set("reporterUserId", reporterUserId);
  }

  const response = NextResponse.redirect(ticketsUrl);
  response.cookies.set(DEBUG_PORTAL_SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
