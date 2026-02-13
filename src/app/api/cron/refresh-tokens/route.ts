import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron call
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Get all tokens expiring within 30 minutes
  const { data: expiringTokens, error } = await supabase.rpc("get_expiring_tokens", {
    minutes_until_expiry: 30,
  });

  if (error || !expiringTokens || expiringTokens.length === 0) {
    return NextResponse.json({ refreshed: 0, message: "No tokens need refreshing" });
  }

  let refreshed = 0;
  let failed = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const token of expiringTokens as any[]) {
    try {
      if (token.provider === "whoop") {
        const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
            client_id: process.env.WHOOP_CLIENT_ID!,
            client_secret: process.env.WHOOP_CLIENT_SECRET!,
          }),
        });

        if (!res.ok) { failed++; continue; }
        const data = await res.json();

        await supabase.rpc("update_provider_token", {
          p_id: token.id,
          p_access_token: data.access_token,
          p_refresh_token: data.refresh_token,
          p_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        });
        refreshed++;
      } else if (token.provider === "withings") {
        const res = await fetch("https://wbsapi.withings.net/v2/oauth2", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            action: "requesttoken",
            grant_type: "refresh_token",
            client_id: process.env.WITHINGS_CLIENT_ID!,
            client_secret: process.env.WITHINGS_CLIENT_SECRET!,
            refresh_token: token.refresh_token,
          }),
        });

        const data = await res.json();
        if (data.status !== 0 || !data.body?.access_token) { failed++; continue; }

        await supabase.rpc("update_provider_token", {
          p_id: token.id,
          p_access_token: data.body.access_token,
          p_refresh_token: data.body.refresh_token,
          p_expires_at: new Date(Date.now() + data.body.expires_in * 1000).toISOString(),
        });
        refreshed++;
      }
      // Hevy tokens don't expire (API keys)
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ refreshed, failed, total: expiringTokens.length });
}
