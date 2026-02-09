import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  // TODO: Exchange code for access token with Withings API
  // For now, acknowledge the callback
  return NextResponse.json({ status: "ok", code: code ? "received" : null });
}

export async function POST(request: NextRequest) {
  // Withings may also send webhook notifications via POST
  return NextResponse.json({ status: "ok" });
}
