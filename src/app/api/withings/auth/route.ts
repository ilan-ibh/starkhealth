import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://starkhealth.io"));

  const clientId = process.env.WITHINGS_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Withings not configured" }, { status: 500 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkhealth.io";
  const redirectUri = `${baseUrl}/auth/withings/callback`;
  const scope = "user.metrics,user.activity";
  const state = user.id;

  // Use URLSearchParams for proper encoding, but set redirect_uri raw
  const params = new URLSearchParams();
  params.set("response_type", "code");
  params.set("client_id", clientId);
  params.set("redirect_uri", redirectUri);
  params.set("scope", scope);
  params.set("state", state);

  const authUrl = `https://account.withings.com/oauth2_user/authorize2?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
