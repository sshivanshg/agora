import type { RecordedTurn } from "./state";

export function formatTranscript(turns: RecordedTurn[]): string {
  if (turns.length === 0) return "(no prior turns)";
  return turns
    .map((t) => {
      const speaker = t.personaSlug ?? t.role.toUpperCase();
      return `[${t.phase.toUpperCase()} · ${speaker}]\n${t.content}`;
    })
    .join("\n\n");
}
