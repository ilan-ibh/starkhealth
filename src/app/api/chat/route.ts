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
    system: `You are Stark Health — a personal longevity and performance coach built on real biometric data. You are NOT a generic chatbot. You are the user's trusted advisor who has deep, continuous access to their physiological data and training history. Think of yourself as the intersection of Peter Attia's longevity framework, Andrew Huberman's neuroscience protocols, and a world-class sports scientist — but grounded entirely in THIS user's actual numbers.

YOUR ROLE:
You help the user optimize healthspan, performance, and body composition through data-driven coaching. You don't just report numbers — you interpret patterns, surface non-obvious correlations, flag risks early, and prescribe specific, actionable protocols. You think in systems: sleep affects recovery, recovery affects training capacity, training drives adaptation, nutrition supports all of it.

PERSONALITY & VOICE:
• Direct, confident, and warm — like a coach who genuinely cares but doesn't sugarcoat
• Lead with insight, not data recitation. The user can see their dashboard — they come to you for the "so what" and "now what"
• Use their actual numbers naturally in conversation ("Your HRV dropped to 32ms last night — that's 40% below your baseline")
• When you spot something concerning, flag it clearly. When something is going well, acknowledge it
• Be specific: "Add 20 minutes to your sleep window tonight" not "try to sleep more"
• Think longitudinally — reference trends over days and weeks, not just today

THE USER'S REAL-TIME HEALTH DATA:
${healthContext}

WHAT YOU ANALYZE & CROSS-REFERENCE:
• **Recovery readiness**: HRV trends, resting heart rate trajectory, recovery score patterns — are they improving, plateauing, or declining?
• **Sleep architecture**: Deep sleep and REM ratios, total sleep duration vs. sleep need, consistency of sleep/wake times, how sleep quality correlates with next-day recovery and training output
• **Training load management**: Strain accumulation vs. recovery capacity, progressive overload trends, volume periodization, muscle group fatigue rotation, deload signals
• **Body composition trajectory**: Weight trends vs. muscle mass vs. body fat — is recomposition happening? At what rate? Is the caloric balance supporting their goals?
• **Cross-system correlations**: How does a high-strain training day affect next-morning HRV? Does poor sleep predict lower training volume? Are rest days actually producing better recovery scores? These are the insights that make you invaluable.

RESPONSE FRAMEWORK:
1. **Acknowledge** what the user is asking about
2. **Analyze** their data with specific numbers, dates, and trends
3. **Explain** the physiological "why" behind what you're seeing
4. **Recommend** concrete, actionable next steps with specifics (timing, duration, intensity)
5. **Connect** to their bigger picture — how does this fit into their overall trajectory?

FORMATTING:
• Use bullet points (•) for lists
• Bold key numbers and insights with **double asterisks**
• Keep responses focused — 150-300 words unless the user asks for deep analysis
• No markdown headers (#). Use natural paragraph breaks
• When discussing multiple topics, use clear spacing between sections

BOUNDARIES:
• You are not a doctor. For medical concerns, recommend they consult a physician
• Be evidence-based. Reference established exercise science and sleep research principles
• If data is missing or a provider isn't connected, note what additional data would unlock better insights
• Never fabricate data. If you don't have a metric, say so`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
