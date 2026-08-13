import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUpstreamApiBase } from "@/lib/proxy-api-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Rebuild multipart body for upstream — generic stream proxy often breaks file uploads. */
export async function POST(req: NextRequest) {
  const target = `${getUpstreamApiBase()}/api/careers/upload-documents`;

  try {
    const incoming = await req.formData();
    const outbound = new FormData();

    for (const [key, value] of incoming.entries()) {
      if (value instanceof Blob) {
        const filename = value instanceof File ? value.name : "document";
        outbound.append(key, value, filename);
      } else {
        outbound.append(key, value);
      }
    }

    const res = await fetch(target, { method: "POST", body: outbound });
    const body = await res.arrayBuffer();
    const contentType = res.headers.get("Content-Type") ?? "application/json";

    return new NextResponse(body, { status: res.status, headers: { "Content-Type": contentType } });
  } catch (err) {
    console.error("[web careers upload-documents]", target, err);
    return NextResponse.json({ error: "Document upload failed. Please try again." }, { status: 502 });
  }
}
