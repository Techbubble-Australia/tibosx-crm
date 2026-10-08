import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import { supportApiBase } from "@/lib/support-api-base";
import { parseTicketingApiErrorBody } from "@/lib/ticketing-api-error";
import { normalizeTicketingPortalUrl } from "@/lib/ticketing-portal-url";

function apiBaseForProduction(): string | null {
  const base = supportApiBase();
  const isLocal = /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?$/i.test(base);
  if (isLocal && process.env.NODE_ENV === "production") {
    return null;
  }
  return base;
}

export async function GET() {
  const portalUrl = normalizeTicketingPortalUrl(process.env.NEXT_PUBLIC_TICKETING_PORTAL_URL);
  const apiUrl = apiBaseForProduction();

  if (!apiUrl) {
    return NextResponse.json(
      {
        error:
          "API_URL is not set on the admin service (use the public https URL of the main TBOS API).",
      },
      { status: 503 },
    );
  }

  const tbosToken = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!tbosToken) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002"));
  }

  try {
    const healthRes = await fetch(`${apiUrl}/health`, { method: "GET" });
    if (!healthRes.ok) {
      return NextResponse.json(
        { error: `Cannot reach TBOS API at ${apiUrl}/health.` },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("ticketing launch: health check failed", err);
    return NextResponse.json(
      { error: `Cannot reach TBOS API at ${apiUrl}/health.` },
      { status: 502 },
    );
  }

  let ssoRes: Response;
  try {
    ssoRes = await fetch(`${apiUrl}/api/ticketing/auth/tbos-sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tbosToken}`,
      },
      body: JSON.stringify({ tbosToken }),
    });
  } catch (err) {
    console.error("ticketing launch: tbos-sso fetch failed", err);
    return NextResponse.json(
      {
        error: `Cannot reach TBOS API at ${apiUrl}. Check API_URL and that the API service is deployed.`,
      },
      { status: 502 },
    );
  }

  const rawText = await ssoRes.text();
  let data: unknown = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }
  if (!ssoRes.ok) {
    const message = parseTicketingApiErrorBody(ssoRes.status, rawText, data);
    return NextResponse.json({ error: message }, { status: ssoRes.status });
  }

  const token = (data as { data?: { token?: unknown } })?.data?.token;
  if (typeof token !== "string") {
    return NextResponse.json({ error: "Invalid SSO response" }, { status: 502 });
  }

  const redirectUrl = `${portalUrl}/auth/consultant?token=${encodeURIComponent(token)}`;
  return NextResponse.redirect(redirectUrl);
}
