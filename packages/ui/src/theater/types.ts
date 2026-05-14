export type PersonaState = "idle" | "listening" | "upcoming" | "speaking" | "complete" | "error";

export type OrchestratorState = "idle" | "active" | "transitioning";

export type CardinalDirection = "n" | "e" | "s" | "w";

export type PersonaSlug =
  | "classicalLiberal"
  | "progressiveReformer"
  | "conservativeTraditionalist"
  | "technocrat";

export const PERSONA_STATE_LABEL: Record<PersonaState, string> = {
  idle: "IDLE",
  listening: "LISTENING",
  upcoming: "UPCOMING",
  speaking: "SPEAKING",
  complete: "COMPLETE",
  error: "ERROR",
};
