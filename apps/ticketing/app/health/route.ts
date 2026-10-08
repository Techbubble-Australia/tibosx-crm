import { NextResponse } from "next/server";

/** Lets load balancers and humans tell portal UI apart from ticketing-api (`service: ticketing-api`). */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ticketing-portal",
    timestamp: new Date().toISOString(),
  });
}
