import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://starkhealth.io";

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/settings?error=whoop_no_code`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/settings?error=whoop_auth_failed`);
  }

  // Validate OAuth state nonce
  const { data: profile } = await supabase.from("profiles").select("oauth_state").eq("id", user.id).single();
  if (!profile || profile.oauth_state !== state) {
    return NextResponse.redirect(`${baseUrl}/settings?error=whoop_csrf_failed`);
  }
  // Clear the nonce
  await supabase.from("profiles").update({ oauth_state: null }).eq("id", user.id);

  // Exchange code for tokens — must match exactly what was sent in auth request
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/whoop/callback`;
  const tokenRes = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("WHOOP token exchange failed");
    return NextResponse.redirect(`${baseUrl}/settings?error=whoop_token_failed`);
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Upsert tokens
  const { error } = await supabase
    .from("provider_tokens")
    .upsert(
      {
        user_id: user.id,
        provider: "whoop",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scopes: tokens.scope || "",
      },
      { onConflict: "user_id,provider" }
    );

  if (error) {
    console.error("Failed to store WHOOP tokens:", error);
    return NextResponse.redirect(`${baseUrl}/settings?error=whoop_store_failed`);
  }

  return NextResponse.redirect(`${baseUrl}/settings?connected=whoop`);
}
