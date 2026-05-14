"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import type { PersonaState } from "./types";

export type Phase =
  | "framing"
  | "opening"
  | "cross_examination"
  | "rebuttal"
  | "closing"
  | "synthesis";

export const PHASE_ORDER: Phase[] = [
  "framing",
  "opening",
  "cross_examination",
  "rebuttal",
  "closing",
  "synthesis",
];

export const PHASE_LABELS: Record<Phase, string> = {
  framing: "FRAMING",
  opening: "OPENING",
  cross_examination: "CROSS-EXAMINATION",
  rebuttal: "REBUTTAL",
  closing: "CLOSING",
  synthesis: "SYNTHESIS",
};

/**
 * The kebab-case persona slugs emitted by the API / orchestrator. These are
 * distinct from the UI-internal camelCase `PersonaSlug` declared in `./types`
 * (kept for backward compat with passes 1-3). The Theater component converts
 * between the two.
 */
export type ApiPersonaSlug =
  | "classical-liberal"
  | "progressive-reformer"
  | "conservative-traditionalist"
  | "technocrat";

export const API_PERSONA_SLUGS: ApiPersonaSlug[] = [
  "classical-liberal",
  "progressive-reformer",
  "conservative-traditionalist",
  "technocrat",
];

export const PERSONA_DISPLAY_NAME: Record<ApiPersonaSlug, string> = {
  "classical-liberal": "THE CLASSICAL LIBERAL",
  "progressive-reformer": "THE PROGRESSIVE REFORMER",
  "conservative-traditionalist": "THE CONSERVATIVE TRADITIONALIST",
  technocrat: "THE TECHNOCRAT",
};

export type TurnRole = "moderator" | "debater" | "synthesizer";

export interface RecordedTurn {
  id: string;
  personaSlug: ApiPersonaSlug | null;
  role: TurnRole;
  phase: Phase;
  content: string;
  tokenCount: number;
  costUsd: number;
  isStreaming: boolean;
}

export interface TheaterState {
  phase: Phase;
  personaStates: Record<ApiPersonaSlug, PersonaState>;
  activeSlug: ApiPersonaSlug | null;
  turns: RecordedTurn[];
  speakingTurnId: string | null;
  totalCostUsd: number;
  totalTokens: number;
  /** true while SSE is open AND not completed */
  isLive: boolean;
  isComplete: boolean;
  errorMessage: string | null;
  /** Personas that have finished their final closing turn */
  completedPersonas: Set<ApiPersonaSlug>;
}

function defaultPersonaStates(): Record<ApiPersonaSlug, PersonaState> {
  return {
    "classical-liberal": "idle",
    "progressive-reformer": "idle",
    "conservative-traditionalist": "idle",
    technocrat: "idle",
  };
}

function initState(initial?: Partial<TheaterState>): TheaterState {
  return {
    phase: "framing",
    personaStates: defaultPersonaStates(),
    activeSlug: null,
    turns: [],
    speakingTurnId: null,
    totalCostUsd: 0,
    totalTokens: 0,
    isLive: false,
    isComplete: false,
    errorMessage: null,
    completedPersonas: new Set<ApiPersonaSlug>(),
    ...initial,
  };
}

type Action =
  | { type: "SSE_OPEN" }
  | { type: "PHASE"; phase: Phase }
  | {
      type: "TURN_START";
      turnId: string;
      personaSlug: ApiPersonaSlug | null;
      role: TurnRole;
      phase: Phase;
    }
  | { type: "TURN_CHUNK"; turnId: string; delta: string }
  | { type: "TURN_END"; turnId: string; tokenCount: number; costUsd: number }
  | { type: "SYNTHESIS_CHUNK"; delta: string }
  | { type: "COMPLETE"; totalCostUsd: number }
  | { type: "ERROR"; message: string };

function reducer(s: TheaterState, a: Action): TheaterState {
  switch (a.type) {
    case "SSE_OPEN": {
      const states: Record<ApiPersonaSlug, PersonaState> = {
        "classical-liberal": s.completedPersonas.has("classical-liberal")
          ? "complete"
          : "listening",
        "progressive-reformer": s.completedPersonas.has("progressive-reformer")
          ? "complete"
          : "listening",
        "conservative-traditionalist": s.completedPersonas.has("conservative-traditionalist")
          ? "complete"
          : "listening",
        technocrat: s.completedPersonas.has("technocrat") ? "complete" : "listening",
      };
      return { ...s, isLive: true, personaStates: states };
    }
    case "PHASE":
      return { ...s, phase: a.phase };
    case "TURN_START": {
      if (a.role !== "debater" || !a.personaSlug) {
        const turn: RecordedTurn = {
          id: a.turnId,
          personaSlug: null,
          role: a.role,
          phase: a.phase,
          content: "",
          tokenCount: 0,
          costUsd: 0,
          isStreaming: true,
        };
        return { ...s, turns: [...s.turns, turn], speakingTurnId: a.turnId };
      }
      const activeSlug: ApiPersonaSlug = a.personaSlug;
      const states: Record<ApiPersonaSlug, PersonaState> = { ...s.personaStates };
      for (const slug of API_PERSONA_SLUGS) {
        if (slug === activeSlug) states[slug] = "speaking";
        else if (s.completedPersonas.has(slug)) states[slug] = "complete";
        else states[slug] = "listening";
      }
      const turn: RecordedTurn = {
        id: a.turnId,
        personaSlug: activeSlug,
        role: "debater",
        phase: a.phase,
        content: "",
        tokenCount: 0,
        costUsd: 0,
        isStreaming: true,
      };
      return {
        ...s,
        personaStates: states,
        activeSlug,
        turns: [...s.turns, turn],
        speakingTurnId: a.turnId,
      };
    }
    case "TURN_CHUNK": {
      const turns = s.turns.map((t) =>
        t.id === a.turnId ? { ...t, content: t.content + a.delta } : t,
      );
      return { ...s, turns };
    }
    case "SYNTHESIS_CHUNK": {
      const idx = s.turns.findIndex((t) => t.role === "synthesizer");
      if (idx < 0) return s;
      const turns = s.turns.map((t, i) => (i === idx ? { ...t, content: t.content + a.delta } : t));
      return { ...s, turns };
    }
    case "TURN_END": {
      const turn = s.turns.find((t) => t.id === a.turnId);
      const turns = s.turns.map((t) =>
        t.id === a.turnId
          ? { ...t, isStreaming: false, tokenCount: a.tokenCount, costUsd: a.costUsd }
          : t,
      );
      const totalCostUsd = s.totalCostUsd + a.costUsd;
      const totalTokens = s.totalTokens + a.tokenCount;
      const completedPersonas = new Set(s.completedPersonas);
      if (turn?.personaSlug && turn.phase === "closing") {
        completedPersonas.add(turn.personaSlug);
      }
      const states: Record<ApiPersonaSlug, PersonaState> = { ...s.personaStates };
      if (turn?.personaSlug) {
        states[turn.personaSlug] = completedPersonas.has(turn.personaSlug)
          ? "complete"
          : "listening";
      }
      return {
        ...s,
        personaStates: states,
        activeSlug: null,
        speakingTurnId: null,
        turns,
        totalCostUsd,
        totalTokens,
        completedPersonas,
      };
    }
    case "COMPLETE": {
      const states: Record<ApiPersonaSlug, PersonaState> = { ...s.personaStates };
      for (const slug of API_PERSONA_SLUGS) states[slug] = "complete";
      return {
        ...s,
        isLive: false,
        isComplete: true,
        personaStates: states,
        activeSlug: null,
        speakingTurnId: null,
        totalCostUsd: a.totalCostUsd,
      };
    }
    case "ERROR": {
      const states: Record<ApiPersonaSlug, PersonaState> = { ...s.personaStates };
      if (s.activeSlug) states[s.activeSlug] = "error";
      return { ...s, isLive: false, errorMessage: a.message, personaStates: states };
    }
    default:
      return s;
  }
}

function isApiPersonaSlug(value: unknown): value is ApiPersonaSlug {
  return typeof value === "string" && (API_PERSONA_SLUGS as readonly string[]).includes(value);
}

export type DebateStatus = "pending" | "running" | "completed" | "failed";

export interface UseTheaterStateOptions {
  debateId: string;
  apiUrl: string;
  initialTurns?: RecordedTurn[] | undefined;
  initialPhase?: Phase | undefined;
  initialCostUsd?: number | undefined;
  initialStatus?: DebateStatus | undefined;
  /** Throttle visual SSE updates to this many events per second for performance */
  throttleHz?: number | undefined;
  /** Polling interval for watching count, in ms (0 disables) */
  watchingPollMs?: number | undefined;
}

export interface UseTheaterStateResult extends TheaterState {
  watchingCount: number;
}

export function useTheaterState({
  debateId,
  apiUrl,
  initialTurns = [],
  initialPhase = "framing",
  initialCostUsd = 0,
  initialStatus = "pending",
  throttleHz = 30,
  watchingPollMs = 5000,
}: UseTheaterStateOptions): UseTheaterStateResult {
  const initial: Partial<TheaterState> = {};
  if (initialTurns.length > 0) {
    initial.turns = initialTurns;
    initial.phase = initialPhase;
    initial.totalCostUsd = initialCostUsd;
    initial.totalTokens = initialTurns.reduce((acc, t) => acc + t.tokenCount, 0);
    initial.isComplete = initialStatus === "completed" || initialStatus === "failed";
    const completed = new Set<ApiPersonaSlug>();
    for (const t of initialTurns) {
      if (t.personaSlug && t.phase === "closing") completed.add(t.personaSlug);
    }
    initial.completedPersonas = completed;
    if (initial.isComplete) {
      initial.personaStates = {
        "classical-liberal": "complete",
        "progressive-reformer": "complete",
        "conservative-traditionalist": "complete",
        technocrat: "complete",
      };
    } else {
      const states: Record<ApiPersonaSlug, PersonaState> = defaultPersonaStates();
      for (const slug of API_PERSONA_SLUGS) {
        states[slug] = completed.has(slug) ? "complete" : "listening";
      }
      initial.personaStates = states;
    }
  }

  const [state, dispatch] = useReducer(reducer, undefined, () => initState(initial));
  const [watchingCount, setWatchingCount] = useState<number>(0);
  const queueRef = useRef<Action[]>([]);
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialStatus === "completed" || initialStatus === "failed") return;

    const es = new EventSource(`${apiUrl}/debates/${debateId}/stream`);
    dispatch({ type: "SSE_OPEN" });

    const flush = () => {
      const q = queueRef.current;
      queueRef.current = [];
      for (const action of q) dispatch(action);
      flushTimerRef.current = null;
    };
    const schedule = () => {
      if (flushTimerRef.current !== null) return;
      flushTimerRef.current = window.setTimeout(flush, 1000 / throttleHz);
    };

    es.onmessage = (e: MessageEvent<string>) => {
      let payload: { type: string; [k: string]: unknown };
      try {
        payload = JSON.parse(e.data) as { type: string; [k: string]: unknown };
      } catch {
        return;
      }
      switch (payload.type) {
        case "phase_change":
          queueRef.current.push({ type: "PHASE", phase: payload.phase as Phase });
          break;
        case "turn_start": {
          const slugRaw = payload.personaSlug;
          const personaSlug = isApiPersonaSlug(slugRaw) ? slugRaw : null;
          queueRef.current.push({
            type: "TURN_START",
            turnId: payload.turnId as string,
            personaSlug,
            role: payload.role as TurnRole,
            phase: payload.phase as Phase,
          });
          break;
        }
        case "turn_chunk":
          queueRef.current.push({
            type: "TURN_CHUNK",
            turnId: payload.turnId as string,
            delta: payload.delta as string,
          });
          break;
        case "turn_end":
          queueRef.current.push({
            type: "TURN_END",
            turnId: payload.turnId as string,
            tokenCount: payload.tokenCount as number,
            costUsd: payload.costUsd as number,
          });
          break;
        case "synthesis_chunk":
          queueRef.current.push({
            type: "SYNTHESIS_CHUNK",
            delta: payload.delta as string,
          });
          break;
        case "complete":
          queueRef.current.push({
            type: "COMPLETE",
            totalCostUsd: payload.totalCostUsd as number,
          });
          break;
        case "error":
          queueRef.current.push({ type: "ERROR", message: payload.message as string });
          break;
        case "fact_check":
          // Pass 4: ignored in theater
          break;
        default:
          break;
      }
      schedule();
    };
    es.onerror = () => {
      // EventSource auto-reconnects on transient errors; we don't dispatch ERROR.
    };
    return () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      es.close();
    };
  }, [apiUrl, debateId, initialStatus, throttleHz]);

  // Watching-count polling
  useEffect(() => {
    if (!watchingPollMs || watchingPollMs <= 0) return;
    if (initialStatus === "completed" || initialStatus === "failed") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const r = await fetch(`${apiUrl}/debates/${debateId}/watching`);
        if (!r.ok) return;
        const data: unknown = await r.json();
        if (
          !cancelled &&
          data &&
          typeof data === "object" &&
          "count" in data &&
          typeof (data as { count: unknown }).count === "number"
        ) {
          setWatchingCount((data as { count: number }).count);
        }
      } catch {
        // ignore network errors
      }
    };
    poll();
    const id = window.setInterval(poll, watchingPollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [apiUrl, debateId, initialStatus, watchingPollMs]);

  return { ...state, watchingCount };
}
