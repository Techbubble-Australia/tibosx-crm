import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUpstreamApiBase } from "@/lib/proxy-api-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Proxy image upload to API (debug-portal upload path — admin role, no TBOS module gate). */
export async function POST(req: NextRequest) {
  const target = `${getUpstreamApiBase()}/api/debug-portal/upload/image`;

  try {
    const incoming = await req.formData();
    const outbound = new FormData();

    for (const [key, value] of incoming.entries()) {
      const upstreamKey = key === "file" && value instanceof Blob ? "image" : key;
      if (value instanceof Blob) {
        const filename = value instanceof File ? value.name : "image.png";
        outbound.append(upstreamKey, value, filename);
      } else {
        outbound.append(upstreamKey, value);
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
    console.error("[debug-portal upload image]", target, err);
    return NextResponse.json({ error: "Image upload failed" }, { status: 502 });
  }
}
