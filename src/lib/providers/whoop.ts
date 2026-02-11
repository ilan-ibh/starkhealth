import type { SupabaseClient } from "@supabase/supabase-js";

const BASE = "https://api.prod.whoop.com/developer";

async function refreshTokenIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  token: { access_token: string; refresh_token: string | null; expires_at: string | null }
) {
  if (!token.expires_at || new Date(token.expires_at) > new Date(Date.now() + 60000)) {
    return token.access_token;
  }

  if (!token.refresh_token) return token.access_token;

  const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    throw new Error("WHOOP token expired — reconnect in Settings");
  }

  const data = await res.json();
  await supabase
    .from("provider_tokens")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "whoop");

  return data.access_token as string;
}

async function whoopGet(accessToken: string, path: string, params?: Record<string, string>) {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`WHOOP ${path} failed: ${res.status}`);
  return res.json();
}

// Paginate through all records for a given endpoint
async function whoopGetAll(accessToken: string, path: string, params: Record<string, string>) {
  const allRecords: unknown[] = [];
  let nextToken: string | null = null;
  do {
    const p: Record<string, string> = { ...params, limit: "25" };
    if (nextToken) p.nextToken = nextToken;
    const data = await whoopGet(accessToken, path, p);
    allRecords.push(...(data.records || []));
    nextToken = data.next_token || null;
  } while (nextToken && allRecords.length < 100);
  return allRecords;
}

export interface WhoopDayData {
  date: string;
  recovery: number | null;
  hrv: number | null;
  rhr: number | null;
  strain: number | null;
  calories: number | null;
  sleepHours: number | null;
  sleepScore: number | null;
  deepSleep: number | null;
  remSleep: number | null;
  lightSleep: number | null;
  awake: number | null;
}

export async function fetchWhoopData(
  supabase: SupabaseClient,
  userId: string,
  tokenRow: { access_token: string; refresh_token: string | null; expires_at: string | null }
): Promise<WhoopDayData[]> {
  const accessToken = await refreshTokenIfNeeded(supabase, userId, tokenRow);

  const start = new Date();
  start.setDate(start.getDate() - 30);
  const startStr = start.toISOString();

  // Fetch recovery, cycles, sleep in parallel
  const [recoveries, cycles, sleeps] = await Promise.all([
    whoopGetAll(accessToken, "/v2/recovery", { start: startStr }),
    whoopGetAll(accessToken, "/v2/cycle", { start: startStr }),
    whoopGetAll(accessToken, "/v2/activity/sleep", { start: startStr }),
  ]);

  // Build a map by date
  const dayMap: Record<string, WhoopDayData> = {};

  const getDate = (isoStr: string) => isoStr.split("T")[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const c of cycles as any[]) {
    const date = getDate(c.start || c.created_at);
    if (!dayMap[date]) dayMap[date] = { date, recovery: null, hrv: null, rhr: null, strain: null, calories: null, sleepHours: null, sleepScore: null, deepSleep: null, remSleep: null, lightSleep: null, awake: null };
    if (c.score) {
      dayMap[date].strain = Math.round(c.score.strain * 10) / 10;
      dayMap[date].calories = Math.round((c.score.kilojoule || 0) / 4.184);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of recoveries as any[]) {
    const cycle = cycles.find((c: unknown) => (c as { cycle_id: number }).cycle_id === r.cycle_id) as { start?: string; created_at?: string } | undefined;
    const date = cycle ? getDate(cycle.start || cycle.created_at || "") : getDate(r.created_at);
    if (!dayMap[date]) continue;
    if (r.score) {
      dayMap[date].recovery = Math.round(r.score.recovery_score);
      dayMap[date].hrv = Math.round((r.score.hrv_rmssd_milli || 0) * 10) / 10;
      dayMap[date].rhr = Math.round(r.score.resting_heart_rate || 0);
    }
  }

  const msToHours = (ms: number) => Math.round((ms / 3600000) * 10) / 10;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of sleeps as any[]) {
    if (s.nap) continue;
    const date = getDate(s.start || s.created_at);
    if (!dayMap[date]) dayMap[date] = { date, recovery: null, hrv: null, rhr: null, strain: null, calories: null, sleepHours: null, sleepScore: null, deepSleep: null, remSleep: null, lightSleep: null, awake: null };
    if (s.score?.stage_summary) {
      const ss = s.score.stage_summary;
      dayMap[date].deepSleep = msToHours(ss.total_slow_wave_sleep_time_milli || 0);
      dayMap[date].remSleep = msToHours(ss.total_rem_sleep_time_milli || 0);
      dayMap[date].lightSleep = msToHours(ss.total_light_sleep_time_milli || 0);
      dayMap[date].awake = msToHours(ss.total_awake_time_milli || 0);
      dayMap[date].sleepHours = Math.round(((ss.total_in_bed_time_milli - ss.total_awake_time_milli) / 3600000) * 10) / 10;
    }
    if (s.score?.sleep_performance_percentage) {
      dayMap[date].sleepScore = Math.round(s.score.sleep_performance_percentage);
    }
  }

  return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
}
