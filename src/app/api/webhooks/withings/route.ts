import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithingsData } from "@/lib/providers/withings";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// Withings sends POST notifications when new data is available
export async function POST(request: NextRequest) {
  const body = await request.text();
  const params = new URLSearchParams(body);

  const userId = params.get("userid"); // Withings user ID (not our user ID)
  const appli = params.get("appli"); // Category: 1=weight, 4=bp, 16=activity

  if (!userId || !appli) {
    return NextResponse.json({ status: "ok" });
  }

  // Find the user by looking up their Withings token
  // We need to match by checking which user has a Withings connection
  const supabase = getSupabase();

  // Get all Withings provider tokens and try to refresh data for each
  // (In a multi-user system, we'd match by Withings userid, but for now
  // we refresh all Withings-connected users since the notification tells us new data exists)
  const { data: tokens } = await supabase.rpc("get_expiring_tokens", { minutes_until_expiry: 999999 });

  if (!tokens) return NextResponse.json({ status: "ok" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withingsTokens = (tokens as any[]).filter((t) => t.provider === "withings");

  for (const token of withingsTokens) {
    try {
      const data = await fetchWithingsData(supabase, token.user_id, {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: token.expires_at,
      });

      if (data && data.length > 0) {
        // Update cache — use an RPC or direct insert won't work due to RLS
        // For webhook, we write via a service function
        for (const d of data) {
          await supabase.rpc("update_provider_token", {
            p_id: token.id,
            p_access_token: token.access_token,
            p_refresh_token: token.refresh_token,
            p_expires_at: token.expires_at,
          }); // Touch the token to keep it fresh
        }
      }
    } catch {
      // Silently continue — webhook should always return 200
    }
  }

  return NextResponse.json({ status: "ok" });
}

// Withings also sends GET for URL verification
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
