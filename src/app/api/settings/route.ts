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
    .select("anthropic_api_key, ai_model, units")
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

  return NextResponse.json({
    anthropic_api_key_masked: masked,
    has_api_key: !!data.anthropic_api_key,
    ai_model: data.ai_model || "claude-sonnet-4-5-20250929",
    units: data.units,
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
  const updates: Record<string, string> = {};

  if (body.anthropic_api_key !== undefined) {
    updates.anthropic_api_key = body.anthropic_api_key;
  }
  if (body.ai_model !== undefined) {
    updates.ai_model = body.ai_model;
  }
  if (body.units !== undefined) {
    updates.units = body.units;
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
