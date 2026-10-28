import type { NextRequest } from "next/server";
import { proxyApiRequest } from "@/lib/proxy-api-request";

type Ctx = { params: { path: string[] } };

function handle(req: NextRequest, ctx: Ctx) {
  return proxyApiRequest(req, ctx.params.path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
