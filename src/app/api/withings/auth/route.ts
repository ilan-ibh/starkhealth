import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://starkhealth.io"));

  const clientId = process.env.WITHINGS_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "Withings not configured" }, { status: 500 });

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/withings/callback`;
  const scope = "user.metrics,user.activity";

  // Generate random nonce and store in profile for CSRF protection
  const state = randomUUID();
  await supabase.from("profiles").update({ oauth_state: state }).eq("id", user.id);

  const authUrl = `https://account.withings.com/oauth2_user/authorize2?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
