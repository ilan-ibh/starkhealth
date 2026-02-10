import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { getSystemPrompt } from "@/lib/health-context";
import { fetchWhoopData } from "@/lib/providers/whoop";
import { fetchWithingsData } from "@/lib/providers/withings";
import { fetchHevyData } from "@/lib/providers/hevy";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// Authenticate and return user context — all data accessed via MCP token, not user_id
async function authenticateToken(token: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("verify_mcp_token", { token });
  if (error || !data || data.length === 0) return null;
  const profile = data[0];
  return {
    token, // keep token for RPC calls that require it
    supabase,
    userId: profile.id as string,
    apiKey: profile.anthropic_api_key as string | null,
    aiModel: (["claude-sonnet-4-5-20250929", "claude-opus-4-6"].includes(profile.ai_model) ? profile.ai_model : "claude-sonnet-4-5-20250929") as string,
  };
}

// Build health context from cache using MCP token (not user_id) for RPC
async function buildMcpContext(supabase: ReturnType<typeof getSupabase>, mcpToken: string): Promise<string> {
  const { data: cachedDays } = await supabase.rpc("get_health_cache_by_token", { mcp_tok: mcpToken });
  const { data: cachedWorkouts } = await supabase.rpc("get_workout_cache_by_token", { mcp_tok: mcpToken });

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
• Sleep: ${latest.sleepHours ?? "N/A"}h (score ${latest.sleepScore ?? "N/A"}%)
• Strain: ${latest.strain ?? "N/A"} | Calories: ${latest.calories ?? "N/A"}
• Weight: ${latest.weight ?? "N/A"}kg | Body Fat: ${latest.bodyFat ?? "N/A"}%
7-DAY AVERAGES: Recovery ${avg("recovery")}% | HRV ${avg("hrv")}ms | Sleep ${avg("sleepHours")}h
FULL DATA: ${JSON.stringify(days)}`);
  }
  if (workouts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalVol = workouts.reduce((s: number, w: any) => s + (w.exercises || []).reduce((es: number, ex: any) => es + (ex.sets || []).filter((st: any) => st.type !== "warmup").reduce((ss: number, st: any) => ss + (st.weight_kg || 0) * (st.reps || 0), 0), 0), 0);
    sections.push(`WORKOUT DATA (${workouts.length} workouts, ${Math.round(totalVol)}kg total volume): ${JSON.stringify(workouts)}`);
  }
  return sections.length > 0 ? sections.join("\n\n") : "No health data cached. Load the dashboard first to sync.";
}

// Use AsyncLocalStorage for request-scoped auth (no global state)
import { AsyncLocalStorage } from "node:async_hooks";
type AuthContext = Awaited<ReturnType<typeof authenticateToken>>;
const authStorage = new AsyncLocalStorage<AuthContext>();

const mcpHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      "refresh_health_data",
      {
        title: "Refresh Health Data",
        description: "Force a fresh fetch from all connected health providers (WHOOP, Withings, Hevy). Returns a structured summary of latest metrics.",
        inputSchema: {},
      },
      async () => {
        const auth = authStorage.getStore();
        if (!auth) return { content: [{ type: "text" as const, text: "Authentication failed. Generate an MCP token in Stark Health Settings." }] };

        const { supabase, token, userId } = auth;
        const { data: tokens } = await supabase.rpc("get_provider_tokens_by_token", { mcp_tok: token });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tokenMap = Object.fromEntries((tokens || []).map((t: any) => [t.provider, t]));

        const [whoopData, , hevyData] = await Promise.all([
          tokenMap.whoop ? fetchWhoopData(supabase, userId, tokenMap.whoop).catch(() => null) : null,
          tokenMap.withings ? fetchWithingsData(supabase, userId, tokenMap.withings).catch(() => null) : null,
          tokenMap.hevy ? fetchHevyData(tokenMap.hevy.access_token).catch(() => null) : null,
        ]);

        if (whoopData && whoopData.length > 0) {
          const rows = whoopData.map((d) => ({ user_id: userId, date: d.date, data: d, synced_at: new Date().toISOString() }));
          await supabase.from("health_cache").upsert(rows, { onConflict: "user_id,date" });
        }
        if (hevyData && hevyData.length > 0) {
          const wRows = hevyData.map((w) => ({ user_id: userId, workout_id: w.id, data: w, synced_at: new Date().toISOString() }));
          await supabase.from("workout_cache").upsert(wRows, { onConflict: "user_id,workout_id" });
        }

        const context = await buildMcpContext(supabase, token);
        return { content: [{ type: "text" as const, text: context }] };
      }
    );

    server.registerTool(
      "ask_stark_health",
      {
        title: "Ask Stark Health",
        description: "Ask the Stark Health AI coach a question about your health data. Uses real WHOOP, Withings, and Hevy data for personalized insights.",
        inputSchema: { question: z.string().describe("Your health question") },
      },
      async ({ question }) => {
        const auth = authStorage.getStore();
        if (!auth) return { content: [{ type: "text" as const, text: "Authentication failed. Generate an MCP token in Stark Health Settings." }] };

        const { supabase, token, apiKey, aiModel } = auth;
        if (!apiKey) return { content: [{ type: "text" as const, text: "No Anthropic API key configured. Add one in Stark Health Settings." }] };

        const healthContext = await buildMcpContext(supabase, token);
        const anthropic = createAnthropic({ apiKey });
        const result = await generateText({
          model: anthropic(aiModel),
          system: getSystemPrompt(healthContext),
          prompt: question,
        });
        return { content: [{ type: "text" as const, text: result.text }] };
      }
    );
  },
  { serverInfo: { name: "Stark Health", version: "1.0.0" } },
  { basePath: "/api", maxDuration: 120, verboseLogs: false }
);

const authedHandler = withMcpAuth(
  mcpHandler,
  async (_req, bearerToken) => {
    if (!bearerToken) return undefined;
    const auth = await authenticateToken(bearerToken);
    if (!auth) return undefined;
    // Store auth in AsyncLocalStorage for this request
    authStorage.enterWith(auth);
    return { token: bearerToken, clientId: auth.userId, scopes: [] };
  },
  { required: false }
);

export { authedHandler as GET, authedHandler as POST };
