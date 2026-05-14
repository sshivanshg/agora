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

const SYNTHESIS_TRUNCATED_NOTE =
  "\n\nNote: This debate was truncated for cost reasons. Synthesize from what we have.";

export const MODERATOR_FRAMING_MAX_TOKENS = 120;
export const MODERATOR_SYNTHESIS_MAX_TOKENS = 450;

export interface ModeratorResult {
  tokenCount: number;
  costUsd: number;
  truncated: boolean;
}

export async function* frame(
  state: DebateState,
  turnId: string,
): AsyncGenerator<string, ModeratorResult> {
  const modelId = { provider: "anthropic" as const, model: "claude-haiku-4-5" };
  const model = await getModel(modelId);
  const result = streamText({
    model,
    system: FRAMING_SYSTEM,
    prompt: `Resolution: ${state.resolution}\n${state.framingNotes ? `Additional context: ${state.framingNotes}` : ""}`,
    temperature: 0.5,
    maxTokens: MODERATOR_FRAMING_MAX_TOKENS,
  });
  for await (const delta of result.textStream) yield delta;
  const usage = await result.usage;
  const finishReason = await result.finishReason;
  const truncated = finishReason === "length";
  if (truncated) {
    yield "…";
  }
  const costUsd = await trackTurnCost(turnId, modelId, {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
  });
  return {
    tokenCount: usage.promptTokens + usage.completionTokens,
    costUsd,
    truncated,
  };
}

export interface SynthesizeOptions {
  truncated?: boolean;
}

export async function* synthesize(
  state: DebateState,
  turnId: string,
  options: SynthesizeOptions = {},
): AsyncGenerator<string, ModeratorResult> {
  const modelId = { provider: "anthropic" as const, model: "claude-haiku-4-5" };
  const model = await getModel(modelId);
  const system = options.truncated
    ? `${SYNTHESIS_SYSTEM}${SYNTHESIS_TRUNCATED_NOTE}`
    : SYNTHESIS_SYSTEM;
  const result = streamText({
    model,
    system,
    prompt: `Resolution: ${state.resolution}\n\nFull transcript:\n${formatTranscript(state.turns)}`,
    temperature: 0.4,
    maxTokens: MODERATOR_SYNTHESIS_MAX_TOKENS,
  });
  for await (const delta of result.textStream) yield delta;
  const usage = await result.usage;
  const finishReason = await result.finishReason;
  const truncated = finishReason === "length";
  if (truncated) {
    yield "…";
  }
  const costUsd = await trackTurnCost(turnId, modelId, {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
  });
  return {
    tokenCount: usage.promptTokens + usage.completionTokens,
    costUsd,
    truncated,
  };
}
