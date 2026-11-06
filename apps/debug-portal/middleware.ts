import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { DEBUG_PORTAL_SESSION_COOKIE } from "@/lib/auth-cookie";
import { debugPortalAbsoluteUrl } from "@/lib/public-origin";

function jwtSecretKey() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
  );
}

const LOGIN = "/login";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(debugPortalAbsoluteUrl(request, pathname));
}

/** Any signed-in TBOS account may use the portal; the API decides which tickets each user can see. */
async function hasPortalSession(token: string): Promise<boolean> {
  const { payload } = await jwtVerify(token, jwtSecretKey());
  return typeof payload.id === "string" && !payload.purpose;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(DEBUG_PORTAL_SESSION_COOKIE)?.value;

  if (pathname.startsWith("/login")) {
    if (!token) return NextResponse.next();
    try {
      if (await hasPortalSession(token)) {
        return redirectTo(request, "/board");
      }
    } catch {
      const res = NextResponse.next();
      res.cookies.delete(DEBUG_PORTAL_SESSION_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!token) {
    return redirectTo(request, LOGIN);
  }

  try {
    if (await hasPortalSession(token)) return NextResponse.next();
  } catch {
    /* invalid or expired token */
  }
  const res = redirectTo(request, LOGIN);
  res.cookies.delete(DEBUG_PORTAL_SESSION_COOKIE);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
