import type { SupabaseClient } from "@supabase/supabase-js";

const API = "https://wbsapi.withings.net";

async function refreshTokenIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  token: { access_token: string; refresh_token: string | null; expires_at: string | null }
) {
  const REFRESH_BUFFER_MS = 30 * 60 * 1000;
  if (!token.expires_at || new Date(token.expires_at) > new Date(Date.now() + REFRESH_BUFFER_MS)) {
    return token.access_token;
  }

  // Re-read token from DB — another process (cron) may have already refreshed it
  const { data: freshToken } = await supabase
    .from("provider_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "withings")
    .single();

  if (freshToken?.expires_at && new Date(freshToken.expires_at) > new Date(Date.now() + REFRESH_BUFFER_MS)) {
    return freshToken.access_token; // Already refreshed by another process
  }

  const refreshToken = freshToken?.refresh_token || token.refresh_token;
  if (!refreshToken) throw new Error("Withings token expired and no refresh token — reconnect in Settings");

  const res = await fetch(`${API}/v2/oauth2`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      action: "requesttoken",
      grant_type: "refresh_token",
      client_id: process.env.WITHINGS_CLIENT_ID!,
      client_secret: process.env.WITHINGS_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();

  if (data.status !== 0 || !data.body?.access_token) {
    // One more check — maybe it was refreshed while we were waiting
    const { data: retryToken } = await supabase
      .from("provider_tokens")
      .select("access_token, expires_at")
      .eq("user_id", userId)
      .eq("provider", "withings")
      .single();

    if (retryToken?.expires_at && new Date(retryToken.expires_at) > new Date()) {
      return retryToken.access_token; // Someone else refreshed it
    }

    throw new Error("Withings token refresh failed — reconnect in Settings");
  }

  await supabase
    .from("provider_tokens")
    .update({
      access_token: data.body.access_token,
      refresh_token: data.body.refresh_token,
      expires_at: new Date(Date.now() + data.body.expires_in * 1000).toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "withings");

  return data.body.access_token as string;
}

export interface WithingsDayData {
  date: string;
  weight: number | null;
  bodyFat: number | null;
  muscleMass: number | null;
  steps: number | null;
}

// Withings measure types
// 1 = weight (kg), 6 = fat ratio (%), 76 = muscle mass (kg)
const MEAS_TYPES = "1,6,76";

export async function fetchWithingsData(
  supabase: SupabaseClient,
  userId: string,
  tokenRow: { access_token: string; refresh_token: string | null; expires_at: string | null }
): Promise<WithingsDayData[]> {
  const accessToken = await refreshTokenIfNeeded(supabase, userId, tokenRow);

  const startDate = Math.floor((Date.now() - 30 * 86400000) / 1000);
  const endDate = Math.floor(Date.now() / 1000);

  // Fetch measurements
  const measRes = await fetch(`${API}/measure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({
      action: "getmeas",
      meastypes: MEAS_TYPES,
      startdate: startDate.toString(),
      enddate: endDate.toString(),
      category: "1", // real measurements only
    }),
  });

  const measData = await measRes.json();

  const dayMap: Record<string, WithingsDayData> = {};

  if (measData.status === 0 && measData.body?.measuregrps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const grp of measData.body.measuregrps as any[]) {
      const date = new Date(grp.date * 1000).toISOString().split("T")[0];
      if (!dayMap[date]) dayMap[date] = { date, weight: null, bodyFat: null, muscleMass: null, steps: null };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const m of grp.measures as any[]) {
        const val = m.value * Math.pow(10, m.unit);
        const rounded = Math.round(val * 10) / 10;
        switch (m.type) {
          case 1: dayMap[date].weight = rounded; break;
          case 6: dayMap[date].bodyFat = rounded; break;
          case 76: dayMap[date].muscleMass = rounded; break;
        }
      }
    }
  }

  // Fetch activity (steps)
  try {
    const actRes = await fetch(`${API}/v2/measure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${accessToken}`,
      },
      body: new URLSearchParams({
        action: "getactivity",
        startdateymd: new Date(startDate * 1000).toISOString().split("T")[0],
        enddateymd: new Date(endDate * 1000).toISOString().split("T")[0],
      }),
    });

    const actData = await actRes.json();
    if (actData.status === 0 && actData.body?.activities) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const a of actData.body.activities as any[]) {
        const date = a.date;
        if (!dayMap[date]) dayMap[date] = { date, weight: null, bodyFat: null, muscleMass: null, steps: null };
        dayMap[date].steps = a.steps || 0;
      }
    }
  } catch (e) {
    console.error("Withings activity fetch failed:", e);
  }

  return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
}
