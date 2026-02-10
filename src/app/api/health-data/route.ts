import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { fetchWhoopData } from "@/lib/providers/whoop";
import { fetchWithingsData } from "@/lib/providers/withings";
import { fetchHevyData } from "@/lib/providers/hevy";
import { sampleData as mockWhoop } from "@/lib/sample-data";
import { hevyWorkouts as mockHevy } from "@/lib/hevy-data";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all provider tokens for this user
  const { data: tokens } = await supabase
    .from("provider_tokens")
    .select("provider, access_token, refresh_token, expires_at")
    .eq("user_id", user.id);

  const tokenMap = Object.fromEntries(
    (tokens || []).map((t) => [t.provider, t])
  );

  const providers = {
    whoop: !!tokenMap.whoop,
    withings: !!tokenMap.withings,
    hevy: !!tokenMap.hevy,
  };

  // Fetch data from connected providers (parallel), fallback to mock
  const [whoopData, withingsData, hevyData] = await Promise.all([
    // WHOOP
    providers.whoop
      ? fetchWhoopData(supabase, user.id, tokenMap.whoop).catch((e) => {
          console.error("WHOOP fetch error:", e);
          return null;
        })
      : null,

    // Withings
    providers.withings
      ? fetchWithingsData(supabase, user.id, tokenMap.withings).catch((e) => {
          console.error("Withings fetch error:", e);
          return null;
        })
      : null,

    // Hevy
    providers.hevy
      ? fetchHevyData(tokenMap.hevy.access_token).catch((e) => {
          console.error("Hevy fetch error:", e);
          return null;
        })
      : null,
  ]);

  // Build unified day data — merge WHOOP + Withings by date
  // If provider returned data, use it. Otherwise use mock.
  const useMockWhoop = !whoopData;
  const useMockWithings = !withingsData;
  const useMockHevy = !hevyData;

  // Build day map
  interface DayRow {
    date: string;
    recovery: number | null; hrv: number | null; rhr: number | null;
    strain: number | null; calories: number | null;
    sleepHours: number | null; sleepScore: number | null;
    deepSleep: number | null; remSleep: number | null; lightSleep: number | null; awake: number | null;
    weight: number | null; bodyFat: number | null; muscleMass: number | null; steps: number | null;
  }

  const dayMap: Record<string, DayRow> = {};
  const emptyDay = (date: string): DayRow => ({
    date, recovery: null, hrv: null, rhr: null, strain: null, calories: null,
    sleepHours: null, sleepScore: null, deepSleep: null, remSleep: null, lightSleep: null, awake: null,
    weight: null, bodyFat: null, muscleMass: null, steps: null,
  });

  if (useMockWhoop) {
    // Use mock WHOOP + Withings data (they're combined in sample-data)
    for (const d of mockWhoop) {
      dayMap[d.date] = {
        date: d.date,
        recovery: d.recovery, hrv: d.hrv, rhr: d.rhr,
        strain: d.strain, calories: d.calories,
        sleepHours: d.sleepHours, sleepScore: d.sleepScore,
        deepSleep: d.deepSleep, remSleep: d.remSleep, lightSleep: d.lightSleep, awake: d.awake,
        weight: useMockWithings ? d.weight : null,
        bodyFat: useMockWithings ? d.bodyFat : null,
        muscleMass: useMockWithings ? d.muscleMass : null,
        steps: useMockWithings ? d.steps : null,
      };
    }
  } else {
    for (const d of whoopData) {
      dayMap[d.date] = { ...emptyDay(d.date), ...d };
    }
  }

  // Overlay Withings real data
  if (!useMockWithings && withingsData) {
    for (const d of withingsData) {
      if (!dayMap[d.date]) dayMap[d.date] = emptyDay(d.date);
      if (d.weight !== null) dayMap[d.date].weight = d.weight;
      if (d.bodyFat !== null) dayMap[d.date].bodyFat = d.bodyFat;
      if (d.muscleMass !== null) dayMap[d.date].muscleMass = d.muscleMass;
      if (d.steps !== null) dayMap[d.date].steps = d.steps;
    }
  }

  const days = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    providers,
    days,
    workouts: useMockHevy ? mockHevy : hevyData,
    usingMock: { whoop: useMockWhoop, withings: useMockWithings, hevy: useMockHevy },
  });
}
