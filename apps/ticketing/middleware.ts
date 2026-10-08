import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { TICKETING_SESSION_COOKIE } from "@/lib/auth-cookie";

function secretKey() {
  return new TextEncoder().encode(
    process.env.TICKETING_JWT_SECRET || process.env.JWT_SECRET || "ticketing-dev-secret",
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TICKETING_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, secretKey());
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(TICKETING_SESSION_COOKIE);
    return res;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
