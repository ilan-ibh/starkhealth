import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { getDataSummaryForAI } from "@/lib/sample-data";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-5-20250929"),
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
    messages,
  });

  return result.toUIMessageStreamResponse();
}
