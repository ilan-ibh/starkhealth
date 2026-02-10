// MCP-specific health context builder — uses RPC functions to bypass RLS

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildHealthContextMcp(supabase: any, userId: string): Promise<string> {
  const { data: cachedDays } = await supabase.rpc("get_health_cache", { p_user_id: userId });
  const { data: cachedWorkouts } = await supabase.rpc("get_workout_cache", { p_user_id: userId });

  const sections: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days = (cachedDays || []).map((r: any) => r.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workouts = (cachedWorkouts || []).map((r: any) => r.data);

  if (days.length > 0) {
    const latest = days[days.length - 1];
    const first = days[0];
    const last7 = days.slice(-7);
    const avg = (key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vals = last7.map((d: any) => d[key]).filter((v: unknown) => v != null) as number[];
      return vals.length ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : "N/A";
    };

    sections.push(`DAILY HEALTH DATA (${first.date} → ${latest.date}, ${days.length} days):

TODAY (${latest.date}):
• Recovery: ${latest.recovery ?? "N/A"}% | HRV: ${latest.hrv ?? "N/A"}ms | RHR: ${latest.rhr ?? "N/A"}bpm
• Sleep: ${latest.sleepHours ?? "N/A"}h (score ${latest.sleepScore ?? "N/A"}%) — Deep ${latest.deepSleep ?? "N/A"}h, REM ${latest.remSleep ?? "N/A"}h, Light ${latest.lightSleep ?? "N/A"}h
• Strain: ${latest.strain ?? "N/A"} | Calories: ${latest.calories ?? "N/A"}
• Weight: ${latest.weight ?? "N/A"}kg | Body Fat: ${latest.bodyFat ?? "N/A"}% | Muscle Mass: ${latest.muscleMass ?? "N/A"}kg
• Steps: ${latest.steps ?? "N/A"}

7-DAY AVERAGES:
• Recovery: ${avg("recovery")}% | HRV: ${avg("hrv")}ms | Sleep: ${avg("sleepHours")}h
• Strain: ${avg("strain")} | Weight: ${avg("weight")}kg | Body Fat: ${avg("bodyFat")}%

30-DAY TRENDS:
• Recovery: ${first.recovery ?? "?"} → ${latest.recovery ?? "?"} | HRV: ${first.hrv ?? "?"} → ${latest.hrv ?? "?"}ms
• Weight: ${first.weight ?? "?"}kg → ${latest.weight ?? "?"}kg | Body Fat: ${first.bodyFat ?? "?"}% → ${latest.bodyFat ?? "?"}%

FULL DAILY DATA (JSON):
${JSON.stringify(days)}`);
  }

  if (workouts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalVol = workouts.reduce((s: number, w: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s + (w.exercises || []).reduce((es: number, ex: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        es + (ex.sets || []).filter((st: any) => st.type !== "warmup").reduce((ss: number, st: any) => ss + (st.weight_kg || 0) * (st.reps || 0), 0), 0), 0);
    const last = workouts[workouts.length - 1];
    sections.push(`WORKOUT DATA (${workouts.length} workouts):
Total volume: ${Math.round(totalVol)}kg | Last workout: ${last.title || "Workout"} on ${last.date}
Full data: ${JSON.stringify(workouts)}`);
  }

  if (sections.length === 0) {
    return "No health data is cached yet. The user needs to load the Stark Health dashboard at least once to sync data from connected providers.";
  }

  return sections.join("\n\n");
}
