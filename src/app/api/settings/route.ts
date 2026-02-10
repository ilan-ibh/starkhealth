import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("anthropic_api_key, ai_model, units, mcp_token")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const masked = data.anthropic_api_key
    ? data.anthropic_api_key.slice(0, 12) +
      "•".repeat(20) +
      data.anthropic_api_key.slice(-4)
    : null;

  // Also check which providers are connected (fast — just checks token existence)
  const { data: tokens } = await supabase
    .from("provider_tokens")
    .select("provider")
    .eq("user_id", user.id);

  const providers = {
    whoop: (tokens || []).some((t) => t.provider === "whoop"),
    withings: (tokens || []).some((t) => t.provider === "withings"),
    hevy: (tokens || []).some((t) => t.provider === "hevy"),
  };

  return NextResponse.json({
    anthropic_api_key_masked: masked,
    has_api_key: !!data.anthropic_api_key,
    ai_model: data.ai_model || "claude-sonnet-4-5-20250929",
    units: data.units,
    mcp_token: data.mcp_token || null,
    providers,
  });
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, string | null> = {};

  if (body.anthropic_api_key !== undefined) {
    updates.anthropic_api_key = body.anthropic_api_key;
  }
  if (body.ai_model !== undefined) {
    updates.ai_model = body.ai_model;
  }
  if (body.units !== undefined) {
    updates.units = body.units;
  }
  if (body.mcp_token !== undefined) {
    updates.mcp_token = body.mcp_token;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
