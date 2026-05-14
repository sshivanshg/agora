import { getModel, trackTurnCost } from "@agora/ai";
import type { Persona } from "@agora/personas";
import { streamText } from "ai";
import type { DebatePhase, RecordedTurn } from "../state";
import { formatTranscript } from "../transcript";

const PHASE_INSTRUCTIONS: Record<DebatePhase, { range: string; rules: string }> = {
  framing: { range: "", rules: "" },
  opening: {
    range: "180-260 words",
    rules:
      "Make your strongest, clearest opening argument. Do not address other speakers — they have not spoken yet.",
  },
  cross_examination: {
    range: "120-200 words",
    rules:
      "You MUST quote or directly reference a specific claim from a prior speaker's opening. Press on the weakest point of their case. Do not restate your own opening.",
  },
  rebuttal: {
    range: "120-220 words",
    rules:
      "You MUST address the strongest challenge raised against your view. Do not dodge. Acknowledge what is true in the opposing case before showing why your view still holds.",
  },
  closing: {
    range: "100-160 words",
    rules:
      "Summarize the case for your position in light of what was actually argued. No new evidence. Land on a single sharp formulation.",
  },
  synthesis: { range: "", rules: "" },
};

export const PHASE_MAX_TOKENS: Record<DebatePhase, number> = {
  framing: 120,
  opening: 380,
  cross_examination: 280,
  rebuttal: 320,
  closing: 220,
  synthesis: 450,
};

function providerForModel(model: string): "anthropic" | "openai" | "google" | "groq" | "ollama" {
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("gpt")) return "openai";
  if (model.startsWith("gemini")) return "google";
  if (model.startsWith("llama")) return "groq";
  return "anthropic";
}

export interface SpeakInput {
  persona: Persona;
  phase: DebatePhase;
  resolution: string;
  framingNotes: string;
  transcript: RecordedTurn[];
  turnId: string;
}

export interface SpeakResult {
  tokenCount: number;
  costUsd: number;
  truncated: boolean;
}

export async function* speak(input: SpeakInput): AsyncGenerator<string, SpeakResult> {
  const { persona, phase, resolution, framingNotes, transcript, turnId } = input;
  const inst = PHASE_INSTRUCTIONS[phase];
  const modelId = {
    provider: providerForModel(persona.modelPreference),
    model: persona.modelPreference,
  };
  const model = await getModel(modelId);

  const systemPrompt = `${persona.body}

---
CURRENT DEBATE CONTEXT
Resolution: ${resolution}
${framingNotes ? `Framing notes: ${framingNotes}\n` : ""}Current phase: ${phase}

TRANSCRIPT SO FAR:
${formatTranscript(transcript)}

YOUR TURN. Speak as ${persona.name}. Length: ${inst.range}.
${inst.rules}

Do not preface with your name. Do not use stage directions. Write only the content of what ${persona.name} would say.`;

  const result = streamText({
    model,
    system: systemPrompt,
    prompt: "Begin your turn.",
    temperature: persona.temperature,
    maxTokens: PHASE_MAX_TOKENS[phase],
  });

  for await (const delta of result.textStream) {
    yield delta;
  }

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
