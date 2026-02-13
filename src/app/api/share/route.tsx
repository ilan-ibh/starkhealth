import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Verify token
  let userData;
  try {
    const verifyRes = await fetch(`${supabaseUrl}/rest/v1/rpc/verify_mcp_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify({ token }),
    });
    userData = await verifyRes.json();
  } catch {
    return new Response("Auth failed", { status: 500 });
  }

  if (!userData || !Array.isArray(userData) || userData.length === 0) {
    return new Response("Invalid token", { status: 401 });
  }

  // Get cached health data
  let days: Record<string, unknown>[] = [];
  try {
    const cacheRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_health_cache_by_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify({ mcp_tok: token }),
    });
    const cached = await cacheRes.json();
    if (Array.isArray(cached)) {
      days = cached.map((r: { data: Record<string, unknown> }) => r.data);
    }
  } catch {
    // Continue with empty data
  }

  // Find most recent non-null values
  const findLatest = (key: string): number | null => {
    for (let i = days.length - 1; i >= 0; i--) {
      const v = days[i]?.[key];
      if (v !== null && v !== undefined) {
        const n = typeof v === "string" ? parseFloat(v as string) : Number(v);
        if (!isNaN(n)) return n;
      }
    }
    return null;
  };

  const recovery = findLatest("recovery");
  const hrv = findLatest("hrv");
  const sleep = findLatest("sleepHours");
  const strain = findLatest("strain");
  const weight = findLatest("weight");
  const bodyFat = findLatest("bodyFat");

  // Simple score
  let score = 0;
  let factors = 0;
  if (recovery !== null) { score += recovery; factors++; }
  if (hrv !== null) { score += Math.min(((hrv - 20) / 80) * 100, 100); factors++; }
  if (sleep !== null) { score += Math.min((sleep / 8) * 100, 100); factors++; }
  score = factors > 0 ? Math.round(score / factors) : 0;

  const recStr = recovery !== null ? `${recovery}%` : "—";
  const hrvStr = hrv !== null ? `${Math.round(hrv)}ms` : "—";
  const sleepStr = sleep !== null ? `${sleep}h` : "—";
  const strainStr = strain !== null ? `${Math.round(strain * 10) / 10}` : "—";
  const weightStr = weight !== null ? `${weight}kg` : "—";
  const bfStr = bodyFat !== null ? `${bodyFat}%` : "—";
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Satori requires simple JSX — no .map(), no dynamic keys
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#000000", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 96, fontWeight: 200, color: "#f0f0f0" }}>{score}</div>
        <div style={{ fontSize: 13, letterSpacing: 4, color: "#666", marginTop: 8 }}>STARK HEALTH SCORE</div>

        <div style={{ display: "flex", gap: 40, marginTop: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 200, color: "#ddd" }}>{recStr}</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginTop: 4 }}>RECOVERY</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 200, color: "#ddd" }}>{hrvStr}</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginTop: 4 }}>HRV</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 200, color: "#ddd" }}>{sleepStr}</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginTop: 4 }}>SLEEP</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 200, color: "#ddd" }}>{strainStr}</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginTop: 4 }}>STRAIN</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 200, color: "#ddd" }}>{weightStr}</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginTop: 4 }}>WEIGHT</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 200, color: "#ddd" }}>{bfStr}</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#555", marginTop: 4 }}>BODY FAT</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 48, gap: 6 }}>
          <div style={{ fontSize: 12, color: "#444" }}>{dateStr}</div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#333" }}>STARKHEALTH.IO</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
