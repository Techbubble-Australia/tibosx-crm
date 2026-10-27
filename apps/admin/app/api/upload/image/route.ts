import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUpstreamApiBase } from "@/lib/proxy-api-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Rebuild multipart for upstream — the generic /api/[...path] stream proxy often breaks file uploads. */
export async function POST(req: NextRequest) {
  const target = `${getUpstreamApiBase()}/api/upload/image`;

  try {
    const incoming = await req.formData();
    const outbound = new FormData();

    for (const [key, value] of incoming.entries()) {
      if (value instanceof Blob) {
        const filename = value instanceof File ? value.name : "image";
        outbound.append(key, value, filename);
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
    console.error("[admin upload image]", target, err);
    return NextResponse.json(
      { error: "Image upload failed. Check API_URL on the admin service and try again." },
      { status: 502 },
    );
  }
}
