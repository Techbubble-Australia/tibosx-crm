import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUpstreamApiBase } from "@/lib/proxy-api-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Proxy comment attachment upload (image or file) to the API's debug-portal upload path. */
export async function POST(req: NextRequest) {
  const target = `${getUpstreamApiBase()}/api/debug-portal/upload/attachment`;

  try {
    const incoming = await req.formData();
    const outbound = new FormData();
    for (const [key, value] of incoming.entries()) {
      if (value instanceof Blob) {
        outbound.append("file", value, value instanceof File ? value.name : "attachment");
      } else {
        outbound.append(key, value);
      }
    }

    const headers = new Headers();
    const cookie = req.headers.get("cookie");
    if (cookie) headers.set("cookie", cookie);

    const res = await fetch(target, { method: "POST", headers, body: outbound });
    const body = await res.arrayBuffer();
    const contentType = res.headers.get("Content-Type") ?? "application/json";
    return new NextResponse(body, { status: res.status, headers: { "Content-Type": contentType } });
  } catch (err) {
    console.error("[debug-portal upload attachment]", target, err);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
