import type { NextRequest } from "next/server";
import { proxyApiRequest } from "@/lib/proxy-api-request";

export async function POST(req: NextRequest) {
  return proxyApiRequest(req, ["auth", "help-support"]);
}
