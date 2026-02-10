import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { buildHealthContext, getSystemPrompt } from "@/lib/health-context";
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

// Look up user by mcp_token from the Authorization header
async function getUserByToken(token: string) {
  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, anthropic_api_key, ai_model")
    .eq("mcp_token", token)
    .single();
  if (!profile) return null;
  return { supabase, userId: profile.id as string, apiKey: profile.anthropic_api_key as string | null, aiModel: profile.ai_model as string };
}

// Cache the auth context per request
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _authCache: Awaited<ReturnType<typeof getUserByToken>> = null;

const mcpHandler = createMcpHandler(
  (server) => {
    // ── Tool 1: refresh_health_data ────────────────────────────────────
    server.registerTool(
      "refresh_health_data",
      {
        title: "Refresh Health Data",
        description:
          "Force a fresh fetch from all connected health providers (WHOOP, Withings, Hevy). Returns a structured summary of the latest health metrics.",
        inputSchema: {},
      },
      async () => {
        if (!_authCache) {
          return { content: [{ type: "text" as const, text: "Authentication failed. Generate an MCP token in Stark Health Settings." }] };
        }
        const { supabase, userId } = _authCache;

        const { data: tokens } = await supabase
          .from("provider_tokens")
          .select("provider, access_token, refresh_token, expires_at")
          .eq("user_id", userId);

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

        const context = await buildHealthContext(supabase, userId);
        return { content: [{ type: "text" as const, text: context }] };
      }
    );

    // ── Tool 2: ask_stark_health ───────────────────────────────────────
    server.registerTool(
      "ask_stark_health",
      {
        title: "Ask Stark Health",
        description:
          "Ask the Stark Health AI coach a question about your health data. Uses real WHOOP, Withings, and Hevy data for personalized insights.",
        inputSchema: {
          question: z.string().describe("Your health question"),
        },
      },
      async ({ question }) => {
        if (!_authCache) {
          return { content: [{ type: "text" as const, text: "Authentication failed. Generate an MCP token in Stark Health Settings." }] };
        }
        const { supabase, userId, apiKey, aiModel } = _authCache;

        if (!apiKey) {
          return { content: [{ type: "text" as const, text: "No Anthropic API key configured. Add one in Stark Health Settings." }] };
        }

        const healthContext = await buildHealthContext(supabase, userId);
        const systemPrompt = getSystemPrompt(healthContext);
        const modelId = ["claude-sonnet-4-5-20250929", "claude-opus-4-6"].includes(aiModel) ? aiModel : "claude-sonnet-4-5-20250929";
        const anthropic = createAnthropic({ apiKey });

        const result = await generateText({
          model: anthropic(modelId),
          system: systemPrompt,
          prompt: question,
        });

        return { content: [{ type: "text" as const, text: result.text }] };
      }
    );
  },
  {
    serverInfo: { name: "Stark Health", version: "1.0.0" },
  },
  {
    basePath: "/api",
    maxDuration: 120,
    verboseLogs: false,
  }
);

// Wrap with auth — verify the Bearer token
const authedHandler = withMcpAuth(
  mcpHandler,
  async (_req, bearerToken) => {
    if (!bearerToken) return undefined;
    const auth = await getUserByToken(bearerToken);
    if (!auth) return undefined;
    _authCache = auth;
    return { token: bearerToken, clientId: auth.userId, scopes: [] };
  },
  { required: false } // Allow unauthenticated discovery, tools check auth themselves
);

export { authedHandler as GET, authedHandler as POST };
