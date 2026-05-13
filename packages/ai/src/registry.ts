export type ProviderId = "anthropic" | "openai" | "google" | "groq" | "ollama";

export interface ModelInfo {
  provider: ProviderId;
  model: string;
  contextWindow: number;
  /** USD per 1M input tokens */
  inputPricePerM: number;
  /** USD per 1M output tokens */
  outputPricePerM: number;
}

export const MODEL_CATALOG: ModelInfo[] = [
  // Anthropic
  {
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    contextWindow: 200_000,
    inputPricePerM: 3,
    outputPricePerM: 15,
  },
  {
    provider: "anthropic",
    model: "claude-opus-4-5",
    contextWindow: 200_000,
    inputPricePerM: 15,
    outputPricePerM: 75,
  },
  {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    contextWindow: 200_000,
    inputPricePerM: 1,
    outputPricePerM: 5,
  },

  // OpenAI
  {
    provider: "openai",
    model: "gpt-4.1",
    contextWindow: 1_000_000,
    inputPricePerM: 2,
    outputPricePerM: 8,
  },
  {
    provider: "openai",
    model: "gpt-5",
    contextWindow: 400_000,
    inputPricePerM: 5,
    outputPricePerM: 15,
  },
  {
    provider: "openai",
    model: "gpt-4o-mini",
    contextWindow: 128_000,
    inputPricePerM: 0.15,
    outputPricePerM: 0.6,
  },

  // Google
  {
    provider: "google",
    model: "gemini-2.5-pro",
    contextWindow: 2_000_000,
    inputPricePerM: 1.25,
    outputPricePerM: 5,
  },
  {
    provider: "google",
    model: "gemini-2.5-flash",
    contextWindow: 1_000_000,
    inputPricePerM: 0.075,
    outputPricePerM: 0.3,
  },

  // Groq
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    contextWindow: 128_000,
    inputPricePerM: 0.59,
    outputPricePerM: 0.79,
  },
  {
    provider: "groq",
    model: "mixtral-8x7b-32768",
    contextWindow: 32_768,
    inputPricePerM: 0.24,
    outputPricePerM: 0.24,
  },

  // Ollama (local — zero cost)
  {
    provider: "ollama",
    model: "llama3.3",
    contextWindow: 128_000,
    inputPricePerM: 0,
    outputPricePerM: 0,
  },
];

export interface ModelId {
  provider: ProviderId;
  model: string;
}

export function findModel(id: ModelId): ModelInfo | undefined {
  return MODEL_CATALOG.find((m) => m.provider === id.provider && m.model === id.model);
}

export function listModels(provider?: ProviderId): ModelInfo[] {
  return provider ? MODEL_CATALOG.filter((m) => m.provider === provider) : MODEL_CATALOG;
}
