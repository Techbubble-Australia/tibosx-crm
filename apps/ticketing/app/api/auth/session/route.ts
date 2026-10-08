import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { TICKETING_SESSION_COOKIE, TICKETING_SESSION_MAX_AGE_SEC } from "@/lib/auth-cookie";

/** Set session from consultant SSO token (one-time handoff from TBOS). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = body && typeof body.token === "string" ? body.token : "";
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(TICKETING_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TICKETING_SESSION_MAX_AGE_SEC,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TICKETING_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
