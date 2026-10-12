import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const apiUrl = process.env.API_URL || "http://localhost:3001";
  const res = await fetch(`${apiUrl}/api/auth/password/forgot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: typeof data.error === "string" ? data.error : "Request failed" },
      { status: res.status },
    );
  }

  return NextResponse.json({
    message:
      typeof data.message === "string"
        ? data.message
        : "If an account exists for that email, we sent password reset instructions.",
  });
}
