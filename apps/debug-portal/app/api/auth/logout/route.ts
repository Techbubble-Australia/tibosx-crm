import { NextResponse } from "next/server";
import { DEBUG_PORTAL_SESSION_COOKIE } from "@/lib/auth-cookie";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(DEBUG_PORTAL_SESSION_COOKIE);
  return response;
}
