import { NextResponse } from "next/server";
import { normalizeAppEnv, readAppEnvRaw } from "@/lib/app-env";

export const dynamic = "force-dynamic";

export function GET() {
  const debugPortalUrl =
    process.env.DEBUG_PORTAL_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_DEBUG_PORTAL_URL?.trim() ||
    null;
  return NextResponse.json({
    env: normalizeAppEnv(readAppEnvRaw()),
    debugPortalUrl: debugPortalUrl ? debugPortalUrl.replace(/\/$/, "") : null,
  });
}
