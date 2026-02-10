import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { getDataSummaryForAI } from "@/lib/sample-data";
import { createClient } from "@/lib/supabase/server";

const VALID_MODELS = [
  "claude-sonnet-4-5-20250929",
  "claude-opus-4-6",
];

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

  const { messages } = (await req.json()) as { messages: UIMessage[] };

  const anthropic = createAnthropic({ apiKey });

  const result = streamText({
    model: anthropic(modelId),
    system: `You are a personal health advisor for Stark Health, an integrated health data platform combining WHOOP (recovery, HRV, sleep, strain) and Withings (weight, body composition) data.

${getDataSummaryForAI()}

GUIDELINES:
- Be concise but thorough. Use bullet points and structure.
- Reference specific data points and dates when answering.
- Provide actionable, evidence-based recommendations.
- Highlight correlations between metrics (e.g., sleep quality → recovery).
- Professional, encouraging tone — like a knowledgeable coach.
- Keep responses under 250 words unless asked for detailed analysis.
- Use plain text, no markdown headers. Use bullet points (•) for lists.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
