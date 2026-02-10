import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://starkhealth.io"));

  const clientId = process.env.WITHINGS_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Withings not configured" }, { status: 500 });

  const redirectUri = "https://starkhealth.io/auth/withings/callback";
  const scope = "user.metrics,user.activity";
  const state = user.id;

  // Build URL with explicit encoding — Withings requires redirect_uri to be encoded
  // but scope commas should NOT be encoded
  const authUrl = `https://account.withings.com/oauth2_user/authorize2?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
