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

export function getUpstreamApiBase(): string {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:3001"
  ).replace(/\/$/, "");
}

/** Forwards /api/* (except dedicated app/api/auth/* routes) to Express at runtime. */
export async function proxyApiRequest(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const subpath = pathSegments.join("/");
  const target = `${getUpstreamApiBase()}/api/${subpath}${req.nextUrl.search}`;

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
    const out = new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
    });
    res.headers.forEach((value, key) => {
      const low = key.toLowerCase();
      if (low === "transfer-encoding") return;
      out.headers.set(key, value);
    });
    return out;
  } catch (err) {
    console.error("[admin api proxy]", target, err);
    return NextResponse.json({ error: "Upstream API unavailable" }, { status: 502 });
  }
}

function isSafeUploadPathSegment(segment: string): boolean {
  return Boolean(segment) && segment !== "." && segment !== "..";
}

/** Forwards `/uploads/*` to the Express API (static files). Same-origin for `<img>` previews in admin. */
export async function proxyUploadsRequest(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const safe = pathSegments.filter(isSafeUploadPathSegment);
  if (safe.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const subpath = safe.join("/");
  const target = `${getUpstreamApiBase()}/uploads/${subpath}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low === "host" || HOP_BY_HOP.has(low)) return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  try {
    const res = await fetch(target, init);
    const out = new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
    });
    res.headers.forEach((value, key) => {
      const low = key.toLowerCase();
      if (low === "transfer-encoding") return;
      if (low === "cross-origin-resource-policy") return;
      out.headers.set(key, value);
    });
    return out;
  } catch (err) {
    console.error("[admin uploads proxy]", target, err);
    return NextResponse.json({ error: "Upstream API unavailable" }, { status: 502 });
  }
}
