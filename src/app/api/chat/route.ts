import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { fetchWhoopData } from "@/lib/providers/whoop";
import { fetchWithingsData } from "@/lib/providers/withings";
import { fetchHevyData } from "@/lib/providers/hevy";

const VALID_MODELS = [
  "claude-sonnet-4-5-20250929",
  "claude-opus-4-6",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildHealthContext(supabase: any, userId: string): Promise<string> {
  const { data: tokens } = await supabase
    .from("provider_tokens")
    .select("provider, access_token, refresh_token, expires_at")
    .eq("user_id", userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenMap = Object.fromEntries((tokens || []).map((t: any) => [t.provider, t]));
  const sections: string[] = [];

  // WHOOP data
  if (tokenMap.whoop) {
    try {
      const data = await fetchWhoopData(supabase, userId, tokenMap.whoop);
      if (data.length > 0) {
        const latest = data[data.length - 1];
        const first = data[0];
        sections.push(`WHOOP DATA (${first.date} → ${latest.date}, ${data.length} days):
Latest: Recovery ${latest.recovery ?? "N/A"}% | HRV ${latest.hrv ?? "N/A"}ms | RHR ${latest.rhr ?? "N/A"}bpm
Sleep: ${latest.sleepHours ?? "N/A"}h (score ${latest.sleepScore ?? "N/A"}%) — Deep ${latest.deepSleep ?? "N/A"}h, REM ${latest.remSleep ?? "N/A"}h, Light ${latest.lightSleep ?? "N/A"}h
Strain: ${latest.strain ?? "N/A"} | Calories: ${latest.calories ?? "N/A"}
Full data: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      sections.push(`WHOOP: Connected but failed to fetch (${(e as Error).message})`);
    }
  }

  // Withings data
  if (tokenMap.withings) {
    try {
      const data = await fetchWithingsData(supabase, userId, tokenMap.withings);
      if (data.length > 0) {
        const latest = data[data.length - 1];
        sections.push(`WITHINGS DATA (${data.length} measurements):
Latest: Weight ${latest.weight ?? "N/A"}kg | Body Fat ${latest.bodyFat ?? "N/A"}% | Muscle Mass ${latest.muscleMass ?? "N/A"}kg | Steps ${latest.steps ?? "N/A"}
Full data: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      sections.push(`WITHINGS: Connected but failed to fetch (${(e as Error).message})`);
    }
  }

  // Hevy data
  if (tokenMap.hevy) {
    try {
      const workouts = await fetchHevyData(tokenMap.hevy.access_token);
      if (workouts.length > 0) {
        const totalVol = workouts.reduce((s, w) =>
          s + w.exercises.reduce((es, ex) =>
            es + ex.sets.filter((st) => st.type !== "warmup").reduce((ss, st) => ss + st.weight_kg * st.reps, 0), 0), 0);
        sections.push(`HEVY WORKOUT DATA (${workouts.length} workouts):
Total volume: ${Math.round(totalVol)}kg | Last workout: ${workouts[workouts.length - 1].title} on ${workouts[workouts.length - 1].date}
Full data: ${JSON.stringify(workouts)}`);
      }
    } catch (e) {
      sections.push(`HEVY: Connected but failed to fetch (${(e as Error).message})`);
    }
  }

  if (sections.length === 0) {
    return "No health data providers are connected yet. The user needs to connect WHOOP, Withings, or Hevy in their Settings.";
  }

  return sections.join("\n\n");
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("anthropic_api_key, ai_model")
    .eq("id", user.id)
    .single();

  const apiKey = profile?.anthropic_api_key;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "No Anthropic API key configured. Add one in Settings.",
      }),
      { status: 400 }
    );
  }

  const modelId = VALID_MODELS.includes(profile?.ai_model)
    ? profile.ai_model
    : "claude-sonnet-4-5-20250929";

  // Fetch real health data for context
  const healthContext = await buildHealthContext(supabase, user.id);

  const { messages } = (await req.json()) as { messages: UIMessage[] };

  const anthropic = createAnthropic({ apiKey });

  const result = streamText({
    model: anthropic(modelId),
    system: `You are a personal health advisor for Stark Health, an integrated health data platform combining WHOOP (recovery, HRV, sleep, strain), Withings (weight, body composition), and Hevy (workout tracking) data.

${healthContext}

GUIDELINES:
- Be concise but thorough. Use bullet points and structure.
- Reference specific data points and dates when answering.
- Provide actionable, evidence-based recommendations.
- Highlight correlations between metrics (e.g., sleep quality → recovery → training performance).
- Professional, encouraging tone — like a knowledgeable coach.
- Keep responses under 250 words unless asked for detailed analysis.
- Use plain text, no markdown headers. Use bullet points (•) for lists.
- If a provider is not connected, mention that connecting it would provide richer insights.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
