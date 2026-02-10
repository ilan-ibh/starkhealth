import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";

const VALID_MODELS = [
  "claude-sonnet-4-5-20250929",
  "claude-opus-4-6",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildHealthContext(supabase: any, userId: string): Promise<string> {
  // Read from cache (populated by /api/health-data)
  const { data: cachedDays } = await supabase
    .from("health_cache")
    .select("data")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  const { data: cachedWorkouts } = await supabase
    .from("workout_cache")
    .select("data")
    .eq("user_id", userId);

  const sections: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days = (cachedDays || []).map((r: any) => r.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workouts = (cachedWorkouts || []).map((r: any) => r.data);

  if (days.length > 0) {
    const latest = days[days.length - 1];
    const first = days[0];

    // Compute 7-day averages
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
    return "No health data is cached yet. The user needs to connect providers in Settings and load the dashboard at least once to sync data.";
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
