import type { Persona } from "@agora/personas";

export type DebatePhase =
  | "framing"
  | "opening"
  | "cross_examination"
  | "rebuttal"
  | "closing"
  | "synthesis";

export const PHASE_ORDER: DebatePhase[] = [
  "framing",
  "opening",
  "cross_examination",
  "rebuttal",
  "closing",
  "synthesis",
];

export type DebateFormat = "oxford_lite" | "socratic" | "lincoln_douglas";

export interface RecordedTurn {
  id: string;
  personaId: string | null;
  personaSlug: string | null;
  role: "moderator" | "debater" | "synthesizer";
  phase: DebatePhase;
  content: string;
  turnOrder: number;
}

export interface DebateState {
  debateId: string;
  resolution: string;
  framingNotes: string;
  personas: Persona[];
  /** Map slug -> dbId for personas */
  personaDbIds: Record<string, string>;
  format: DebateFormat;
  phase: DebatePhase;
  turns: RecordedTurn[];
  totalCostUsd: number;
  isComplete: boolean;
}

export type DebateStreamEvent =
  | { type: "phase_change"; phase: DebatePhase }
  | {
      type: "turn_start";
      turnId: string;
      personaSlug: string | null;
      role: RecordedTurn["role"];
      phase: DebatePhase;
    }
  | { type: "turn_chunk"; turnId: string; delta: string }
  | { type: "turn_end"; turnId: string; tokenCount: number; costUsd: number }
  | {
      type: "fact_check";
      turnId: string;
      verdict: "supported" | "contested" | "unverified" | "false";
      claim: string;
    }
  | { type: "synthesis_chunk"; delta: string }
  | { type: "complete"; totalCostUsd: number }
  | { type: "error"; message: string };
