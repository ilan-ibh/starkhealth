import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { fetchWhoopData } from "@/lib/providers/whoop";
import { fetchWithingsData } from "@/lib/providers/withings";
import { fetchHevyData } from "@/lib/providers/hevy";

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

interface DayRow {
  date: string;
  recovery: number | null; hrv: number | null; rhr: number | null;
  strain: number | null; calories: number | null;
  sleepHours: number | null; sleepScore: number | null;
  deepSleep: number | null; remSleep: number | null; lightSleep: number | null; awake: number | null;
  weight: number | null; bodyFat: number | null; muscleMass: number | null; steps: number | null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get provider tokens
  const { data: tokens } = await supabase
    .from("provider_tokens")
    .select("provider, access_token, refresh_token, expires_at")
    .eq("user_id", user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenMap = Object.fromEntries((tokens || []).map((t: any) => [t.provider, t]));

  const providers = {
    whoop: !!tokenMap.whoop,
    withings: !!tokenMap.withings,
    hevy: !!tokenMap.hevy,
  };

  const hasAnyProvider = providers.whoop || providers.withings || providers.hevy;

  // ── Check cache ────────────────────────────────────────────────────────
  if (hasAnyProvider) {
    const { data: cachedDays } = await supabase
      .from("health_cache")
      .select("date, data, synced_at")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    const { data: cachedWorkouts } = await supabase
      .from("workout_cache")
      .select("workout_id, data, synced_at")
      .eq("user_id", user.id);

    // Check if cache is fresh (any row synced within TTL)
    const now = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isFresh = cachedDays && cachedDays.length > 0 && cachedDays.some((r: any) =>
      now - new Date(r.synced_at).getTime() < CACHE_TTL_MS
    );

    if (isFresh) {
      return NextResponse.json({
        providers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        days: cachedDays.map((r: any) => r.data),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        workouts: (cachedWorkouts || []).map((r: any) => r.data),
        usingMock: { whoop: false, withings: false, hevy: false },
        cached: true,
      });
    }
  }

  // ── Fetch fresh data ───────────────────────────────────────────────────
  const [whoopData, withingsData, hevyData] = await Promise.all([
    providers.whoop
      ? fetchWhoopData(supabase, user.id, tokenMap.whoop).catch((e) => { console.error("WHOOP fetch error:", e); return null; })
      : null,
    providers.withings
      ? fetchWithingsData(supabase, user.id, tokenMap.withings).catch((e) => { console.error("Withings fetch error:", e); return null; })
      : null,
    providers.hevy
      ? fetchHevyData(tokenMap.hevy.access_token).catch((e) => { console.error("Hevy fetch error:", e); return null; })
      : null,
  ]);

  // Build day map — no mock data, only real provider data
  const dayMap: Record<string, DayRow> = {};
  const emptyDay = (date: string): DayRow => ({
    date, recovery: null, hrv: null, rhr: null, strain: null, calories: null,
    sleepHours: null, sleepScore: null, deepSleep: null, remSleep: null, lightSleep: null, awake: null,
    weight: null, bodyFat: null, muscleMass: null, steps: null,
  });

  if (whoopData) {
    for (const d of whoopData) {
      dayMap[d.date] = { ...emptyDay(d.date), ...d };
    }
  }

  if (withingsData) {
    for (const d of withingsData) {
      if (!dayMap[d.date]) dayMap[d.date] = emptyDay(d.date);
      if (d.weight !== null) dayMap[d.date].weight = d.weight;
      if (d.bodyFat !== null) dayMap[d.date].bodyFat = d.bodyFat;
      if (d.muscleMass !== null) dayMap[d.date].muscleMass = d.muscleMass;
      if (d.steps !== null) dayMap[d.date].steps = d.steps;
    }
  }

  const days = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  const workouts = hevyData || [];

  // ── Write to cache ─────────────────────────────────────────────────────
  if (hasAnyProvider) {
    // Cache days
    if (days.length > 0) {
      const rows = days.map((d) => ({
        user_id: user.id,
        date: d.date,
        data: d,
        synced_at: new Date().toISOString(),
      }));
      const { error: cacheErr } = await supabase.from("health_cache").upsert(rows, { onConflict: "user_id,date" });
      if (cacheErr) console.error("Cache write error:", cacheErr);
    }

    // Cache workouts
    if (workouts && Array.isArray(workouts) && workouts.length > 0) {
      const wRows = workouts.map((w) => ({
        user_id: user.id,
        workout_id: w.id,
        data: w,
        synced_at: new Date().toISOString(),
      }));
      const { error: wCacheErr } = await supabase.from("workout_cache").upsert(wRows, { onConflict: "user_id,workout_id" });
      if (wCacheErr) console.error("Workout cache write error:", wCacheErr);
    }
  }

  return NextResponse.json({
    providers,
    days,
    workouts: workouts || [],
    cached: false,
  });
}
