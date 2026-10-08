import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTicketingApiBase } from "@/lib/proxy-ticketing-api";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const SKIP_RESPONSE_HEADERS = new Set([
  "transfer-encoding",
  "content-encoding",
  "content-length",
  "cross-origin-resource-policy",
  "content-security-policy",
]);

function isSafeSegment(segment: string): boolean {
  return Boolean(segment) && segment !== "." && segment !== "..";
}

/** Same-origin `/uploads/tickets/*` → main API (for image previews in the portal). */
export async function proxyTicketUploadsRequest(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const safe = pathSegments.filter(isSafeSegment);
  if (safe.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const subpath = safe.map((s) => encodeURIComponent(decodeURIComponent(s))).join("/");
  const target = `${getTicketingApiBase()}/uploads/tickets/${subpath}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low === "host" || HOP_BY_HOP.has(low)) return;
    headers.set(key, value);
  });

  try {
    const res = await fetch(target, { method: req.method, headers, redirect: "manual", cache: "no-store" });
    const bodyBuf = await res.arrayBuffer();
    const out = new NextResponse(bodyBuf, { status: res.status, statusText: res.statusText });
    res.headers.forEach((value, key) => {
      const low = key.toLowerCase();
      if (SKIP_RESPONSE_HEADERS.has(low) || HOP_BY_HOP.has(low)) return;
      out.headers.set(key, value);
    });
    return out;
  } catch (err) {
    console.error("[ticketing uploads proxy]", target, err);
    return NextResponse.json({ error: "Ticketing API unavailable" }, { status: 502 });
  }
}
