import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkhealth.io";

  // If no code, just return 200 (for Withings URL verification)
  if (!code) {
    return NextResponse.json({ status: "ok" });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/settings?error=withings_auth_failed`);
  }

  // Validate OAuth state nonce
  const { data: profile } = await supabase.from("profiles").select("oauth_state").eq("id", user.id).single();
  if (!profile || profile.oauth_state !== state) {
    return NextResponse.redirect(`${baseUrl}/settings?error=withings_csrf_failed`);
  }
  await supabase.from("profiles").update({ oauth_state: null }).eq("id", user.id);

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/withings/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://wbsapi.withings.net/v2/oauth2", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      action: "requesttoken",
      grant_type: "authorization_code",
      client_id: process.env.WITHINGS_CLIENT_ID!,
      client_secret: process.env.WITHINGS_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await tokenRes.json();

  if (data.status !== 0 || !data.body?.access_token) {
    console.error("Withings token exchange failed");
    return NextResponse.redirect(`${baseUrl}/settings?error=withings_token_failed`);
  }

  const tokens = data.body;
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error } = await supabase
    .from("provider_tokens")
    .upsert(
      {
        user_id: user.id,
        provider: "withings",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scopes: tokens.scope || "",
      },
      { onConflict: "user_id,provider" }
    );

  if (error) {
    console.error("Failed to store Withings tokens:", error);
    return NextResponse.redirect(`${baseUrl}/settings?error=withings_store_failed`);
  }

  return NextResponse.redirect(`${baseUrl}/settings?connected=withings`);
}
