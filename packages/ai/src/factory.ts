import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { createOllama } from "ollama-ai-provider";
import { getActiveKey } from "./keys";
import { type ModelId, findModel } from "./registry";

export class UnknownModelError extends Error {
  constructor(id: ModelId) {
    super(`Unknown model: ${id.provider}/${id.model}`);
    this.name = "UnknownModelError";
  }
}

export async function getModel(id: ModelId): Promise<LanguageModel> {
  if (!findModel(id)) throw new UnknownModelError(id);
  const key = await getActiveKey(id.provider);

  switch (id.provider) {
    case "anthropic":
      return createAnthropic({ apiKey: key.apiKey })(id.model);
    case "openai": {
      const openaiOpts: { apiKey: string; baseURL?: string } = { apiKey: key.apiKey };
      if (key.baseUrl) openaiOpts.baseURL = key.baseUrl;
      return createOpenAI(openaiOpts)(id.model);
    }
    case "google":
      return createGoogleGenerativeAI({ apiKey: key.apiKey })(id.model);
    case "groq":
      return createGroq({ apiKey: key.apiKey })(id.model);
    case "ollama":
      return createOllama({ baseURL: key.baseUrl ?? "http://localhost:11434/api" })(id.model);
    default: {
      const exhaustive: never = id.provider;
      throw new Error(`Unhandled provider: ${exhaustive as string}`);
    }
  }
}
