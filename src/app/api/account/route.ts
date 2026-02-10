import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete all user data (cascades from auth.users via FK constraints)
  // Clean up cached data first
  await supabase.from("health_cache").delete().eq("user_id", user.id);
  await supabase.from("workout_cache").delete().eq("user_id", user.id);
  await supabase.from("provider_tokens").delete().eq("user_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  // Sign out the user (this invalidates their session)
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
