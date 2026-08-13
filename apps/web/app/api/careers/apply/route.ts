import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUpstreamApiBase } from "@/lib/proxy-api-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const target = `${getUpstreamApiBase()}/api/careers/apply`;

  try {
    const body = await req.text();
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const responseBody = await res.arrayBuffer();
    const contentType = res.headers.get("Content-Type") ?? "application/json";

    return new NextResponse(responseBody, { status: res.status, headers: { "Content-Type": contentType } });
  } catch (err) {
    console.error("[web careers apply]", target, err);
    return NextResponse.json({ error: "Submission failed. Please try again." }, { status: 502 });
  }
}
