import { getModel, trackTurnCost } from "@agora/ai";
import { streamText } from "ai";
import type { DebateState } from "../state";
import { formatTranscript } from "../transcript";

const FRAMING_SYSTEM = `You are the moderator of a structured debate. You will produce a single neutral paragraph (~80-120 words) that:
1. Restates the resolution in your own words
2. Identifies the key terms that will need definition
3. Names the core tension at the heart of the question

Do not take a side. Do not preview what speakers will say. Write only the framing paragraph.`;

const SYNTHESIS_SYSTEM = `You are the moderator of a structured debate that has now concluded. Read the transcript and produce a synthesis of approximately 200-300 words. Your synthesis must:
1. Identify the genuine cruxes — the places where the speakers actually disagreed about something substantive
2. Name the points of agreement that emerged
3. Surface the questions that remain open
You are not declaring a winner. You are helping a reader think more clearly about the question. Write in measured, careful prose.`;

export async function* frame(
  state: DebateState,
  turnId: string,
): AsyncGenerator<string, { tokenCount: number; costUsd: number }> {
  const modelId = { provider: "anthropic" as const, model: "claude-sonnet-4-5" };
  const model = await getModel(modelId);
  const result = streamText({
    model,
    system: FRAMING_SYSTEM,
    prompt: `Resolution: ${state.resolution}\n${state.framingNotes ? `Additional context: ${state.framingNotes}` : ""}`,
    temperature: 0.5,
  });
  for await (const delta of result.textStream) yield delta;
  const usage = await result.usage;
  const costUsd = await trackTurnCost(turnId, modelId, {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
  });
  return { tokenCount: usage.promptTokens + usage.completionTokens, costUsd };
}

export async function* synthesize(
  state: DebateState,
  turnId: string,
): AsyncGenerator<string, { tokenCount: number; costUsd: number }> {
  const modelId = { provider: "anthropic" as const, model: "claude-sonnet-4-5" };
  const model = await getModel(modelId);
  const result = streamText({
    model,
    system: SYNTHESIS_SYSTEM,
    prompt: `Resolution: ${state.resolution}\n\nFull transcript:\n${formatTranscript(state.turns)}`,
    temperature: 0.4,
  });
  for await (const delta of result.textStream) yield delta;
  const usage = await result.usage;
  const costUsd = await trackTurnCost(turnId, modelId, {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
  });
  return { tokenCount: usage.promptTokens + usage.completionTokens, costUsd };
}
