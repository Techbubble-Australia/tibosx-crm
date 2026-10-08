import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function getTicketingApiBase(): string {
  return (process.env.TICKETING_API_URL || "http://127.0.0.1:3003").replace(/\/$/, "");
}

export async function proxyTicketingApiRequest(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const subpath = pathSegments.join("/");
  const target = `${getTicketingApiBase()}/api/${subpath}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const low = key.toLowerCase();
    if (low === "host") return;
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

  const res = await fetch(target, init);
  const bodyBuf = await res.arrayBuffer();
  const out = new NextResponse(bodyBuf, { status: res.status, statusText: res.statusText });
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    out.headers.set(key, value);
  });
  return out;
}
