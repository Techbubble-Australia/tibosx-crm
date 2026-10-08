import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth-cookie";
import { normalizeTicketingPortalUrl } from "@/lib/ticketing-portal-url";

function ticketingApiBase(): string | null {
  const raw = process.env.TICKETING_API_URL?.trim();
  if (!raw) return null;
  const base = raw.replace(/\/$/, "");
  const isLocal = /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?$/i.test(base);
  if (isLocal && process.env.NODE_ENV === "production") {
    return null;
  }
  return base;
}

export async function GET() {
  const portalUrl = normalizeTicketingPortalUrl(process.env.NEXT_PUBLIC_TICKETING_PORTAL_URL);
  const ticketingApi = ticketingApiBase();

  if (!ticketingApi) {
    return NextResponse.json(
      {
        error:
          "TICKETING_API_URL is not set on the admin service (use the public https URL of ticketing-api, not localhost:3003).",
      },
      { status: 503 },
    );
  }

  const tbosToken = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!tbosToken) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002"));
  }

  let ssoRes: Response;
  try {
    ssoRes = await fetch(`${ticketingApi}/api/auth/tbos-sso`, {
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
        error: `Cannot reach ticketing API at ${ticketingApi}. Check TICKETING_API_URL and that ticketing-api is deployed.`,
      },
      { status: 502 },
    );
  }

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
