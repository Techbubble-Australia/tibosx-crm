import { NextResponse } from "next/server";

/** Lets load balancers tell portal UI apart from the main TBOS API. */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ticketing-portal",
    timestamp: new Date().toISOString(),
  });
}
