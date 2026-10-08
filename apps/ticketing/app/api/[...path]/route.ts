import type { NextRequest } from "next/server";
import { proxyTicketingApiRequest } from "@/lib/proxy-ticketing-api";

type Ctx = { params: { path: string[] } };

function handle(req: NextRequest, ctx: Ctx) {
  return proxyTicketingApiRequest(req, ctx.params.path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
