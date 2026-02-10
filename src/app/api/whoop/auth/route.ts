import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://starkhealth.io"));

  const clientId = process.env.WHOOP_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "WHOOP not configured" }, { status: 500 });

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "https://starkhealth.io"}/whoop/callback`;
  const scopes = "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline";
  const state = user.id; // use user id as state for verification

  const authUrl = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
