import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
]);

export function getTicketingApiBase(): string {
  return (process.env.TICKETING_API_URL || "http://127.0.0.1:3003").replace(/\/$/, "");
}

export async function proxyTicketingApiRequest(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const subpath = pathSegments.join("/");
  const target = `${getTicketingApiBase()}/api/${subpath}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low === "host" || HOP_BY_HOP.has(low)) return;
    headers.set(key, value);
  });

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (hasBody && req.body) {
    init.body = req.body;
    init.duplex = "half";
  }

  try {
    const res = await fetch(target, init);
    const bodyBuf = await res.arrayBuffer();
    const out = new NextResponse(bodyBuf, { status: res.status, statusText: res.statusText });
    res.headers.forEach((value, key) => {
      const low = key.toLowerCase();
      if (SKIP_RESPONSE_HEADERS.has(low) || HOP_BY_HOP.has(low)) return;
      out.headers.set(key, value);
    });
    return out;
  } catch (err) {
    console.error("[ticketing api proxy]", target, err);
    return NextResponse.json({ error: "Ticketing API unavailable" }, { status: 502 });
  }
}
