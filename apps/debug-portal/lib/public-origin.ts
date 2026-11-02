import type { NextRequest } from "next/server";

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function isInternalHost(host: string): boolean {
  const h = host.toLowerCase();
  return h.startsWith("0.0.0.0:") || h === "0.0.0.0" || h.startsWith("127.0.0.1:") || h === "localhost";
}

/** Public browser origin for redirects (Railway serves the app on 0.0.0.0 internally). */
export function debugPortalPublicOrigin(req: NextRequest): string {
  const fromEnv = normalizeOrigin(
    process.env.DEBUG_PORTAL_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_DEBUG_PORTAL_URL ||
      "",
  );
  if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) {
    return fromEnv;
  }

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().replace(/:$/, "") || "https";
  if (forwardedHost && !isInternalHost(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = req.nextUrl.host;
  if (host && !isInternalHost(host)) {
    return req.nextUrl.origin;
  }

  return "http://localhost:3000";
}

export function debugPortalAbsoluteUrl(req: NextRequest, pathname: string): URL {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(path, `${debugPortalPublicOrigin(req)}/`);
}
