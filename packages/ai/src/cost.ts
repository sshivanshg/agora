import { type ModelId, findModel } from "./registry";

export function estimateCost(id: ModelId, inputTokens: number, outputTokens: number): number {
  const info = findModel(id);
  if (!info) return 0;
  return (
    (inputTokens / 1_000_000) * info.inputPricePerM +
    (outputTokens / 1_000_000) * info.outputPricePerM
  );
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
}

export async function trackTurnCost(turnId: string, id: ModelId, usage: Usage): Promise<number> {
  const cost = estimateCost(id, usage.promptTokens, usage.completionTokens);
  const { db, debateTurns, eq } = await import("@agora/db");
  await db
    .update(debateTurns)
    .set({
      tokenCount: usage.promptTokens + usage.completionTokens,
      modelUsed: `${id.provider}/${id.model}`,
      costUsd: cost,
    })
    .where(eq(debateTurns.id, turnId));
  return cost;
}
