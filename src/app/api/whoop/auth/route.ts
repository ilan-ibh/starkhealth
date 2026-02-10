import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://starkhealth.io"));

  const clientId = process.env.WHOOP_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "WHOOP not configured" }, { status: 500 });

  const redirectUri = "https://starkhealth.io/whoop/callback";
  const scopes = "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline";
  const state = user.id;

  const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(authUrl);
}
