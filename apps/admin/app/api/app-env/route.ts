import { NextResponse } from "next/server";
import { normalizeAppEnv, readAppEnvRaw } from "@/lib/app-env";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ env: normalizeAppEnv(readAppEnvRaw()) });
}
