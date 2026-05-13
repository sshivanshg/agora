import { db, factChecks } from "@agora/db";
import type { RecordedTurn } from "../state";

/**
 * Stub fact checker. Returns "unverified" for any extracted claim.
 * Phase 5 wires real search.
 */
export async function checkTurn(turn: RecordedTurn, debateId: string): Promise<void> {
  const sentences = turn.content.split(/(?<=[.!?])\s+/);
  const candidates = sentences.filter((s) => /\b\d|[A-Z][a-z]+ [A-Z][a-z]+|%/.test(s)).slice(0, 3);

  for (const claim of candidates) {
    await db
      .insert(factChecks)
      .values({
        debateId,
        turnId: turn.id,
        claim,
        verdict: "unverified",
        confidence: 0,
        sources: [],
        reasoning: "Stub fact-checker. Real verification ships in Phase 5.",
      })
      .catch(() => {
        /* ignore */
      });
  }
}
