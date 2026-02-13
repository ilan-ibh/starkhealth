import { ImageResponse } from "next/og";
import { createServerClient } from "@supabase/ssr";

export const runtime = "edge";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const supabase = getSupabase();
  const { data } = await supabase.rpc("verify_mcp_token", { token });
  if (!data || data.length === 0) {
    return new Response("Invalid token", { status: 401 });
  }

  const userId = data[0].id;

  // Get latest health data from cache
  const { data: cachedDays } = await supabase.rpc("get_health_cache_by_token", { mcp_tok: token });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days = (cachedDays || []).map((r: any) => r.data);

  // Find most recent values
  const findLatest = (key: string): number | null => {
    for (let i = days.length - 1; i >= 0; i--) {
      const v = days[i][key];
      if (v !== null && v !== undefined) return typeof v === "string" ? parseFloat(v) : v;
    }
    return null;
  };

  const recovery = findLatest("recovery");
  const hrv = findLatest("hrv");
  const sleep = findLatest("sleepHours");
  const strain = findLatest("strain");
  const weight = findLatest("weight");
  const bodyFat = findLatest("bodyFat");

  // Compute simple health score
  let score = 0;
  let factors = 0;
  if (recovery !== null) { score += recovery; factors++; }
  if (hrv !== null) { score += Math.min(((hrv - 20) / 80) * 100, 100); factors++; }
  if (sleep !== null) { score += Math.min((sleep / 8) * 100, 100); factors++; }
  if (factors > 0) score = Math.round(score / factors);

  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #111111 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "96px", fontWeight: 200, color: "#f5f5f5", lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: "14px", letterSpacing: "4px", color: "#666", marginTop: "8px", textTransform: "uppercase" }}>
            Stark Health Score
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display: "flex", gap: "48px", marginBottom: "40px" }}>
          {[
            { label: "Recovery", value: recovery !== null ? `${recovery}%` : "—" },
            { label: "HRV", value: hrv !== null ? `${Math.round(hrv)}ms` : "—" },
            { label: "Sleep", value: sleep !== null ? `${sleep}h` : "—" },
            { label: "Strain", value: strain !== null ? `${strain}` : "—" },
            { label: "Weight", value: weight !== null ? `${weight}kg` : "—" },
            { label: "Body Fat", value: bodyFat !== null ? `${bodyFat}%` : "—" },
          ].map((m) => (
            <div key={m.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 200, color: "#e0e0e0" }}>{m.value}</div>
              <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#555", marginTop: "4px", textTransform: "uppercase" }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{ fontSize: "12px", color: "#444" }}>{dateStr}</div>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: "#333", textTransform: "uppercase" }}>starkhealth.io</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
