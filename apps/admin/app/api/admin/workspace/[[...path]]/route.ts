import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { workspaceServerFetch } from "@/lib/workspace-server";

type Ctx = { params: { path?: string[] } };

async function handle(req: NextRequest, ctx: Ctx) {
  const segments = ctx.params.path ?? [];
  const subpath = `/${segments.join("/")}${req.nextUrl.search}`;

  try {
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const init: RequestInit & { duplex?: "half" } = { method: req.method };
    if (hasBody && req.body) {
      init.body = req.body;
      init.duplex = "half";
      const contentType = req.headers.get("content-type");
      if (contentType) {
        init.headers = { "Content-Type": contentType };
      }
    }

    const res = await workspaceServerFetch(subpath, init);
    const body = await res.arrayBuffer();
    const out = new NextResponse(body, { status: res.status, statusText: res.statusText });
    const skip = new Set(["transfer-encoding", "content-encoding", "content-length"]);
    res.headers.forEach((value, key) => {
      if (skip.has(key.toLowerCase())) return;
      out.headers.set(key, value);
    });
    return out;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workspace API error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
