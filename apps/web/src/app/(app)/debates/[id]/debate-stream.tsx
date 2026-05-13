"use client";
import { DebateMessage, PhaseBar, Resolution, Separator } from "@agora/ui";
import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const DEBATE_PHASES = [
  "Framing",
  "Opening",
  "Cross-Examination",
  "Rebuttal",
  "Closing",
  "Synthesis",
];
const PHASE_ORDER = ["framing", "opening", "cross_examination", "rebuttal", "closing", "synthesis"];

interface TurnView {
  id: string;
  personaId: string | null;
  phase: string;
  role: string;
  content: string;
  turnOrder: number;
  tokenCount: number;
  costUsd: number;
  isStreaming: boolean;
}

interface DebatePersona {
  id: string;
  slug: string;
  name: string;
  worldviewTag: string;
}

interface InitialDebate {
  id: string;
  resolution: string;
  status: string;
  totalCost: number;
  country: string;
}

export function DebateStream({
  debateId,
  initialDebate,
  initialTurns,
  personas,
}: {
  debateId: string;
  initialDebate: InitialDebate;
  initialTurns: TurnView[];
  personas: DebatePersona[];
}) {
  const [debate, setDebate] = useState(initialDebate);
  const [turns, setTurns] = useState<TurnView[]>(initialTurns);
  const [, setSynthesisDelta] = useState("");
  const personaMap = new Map(personas.map((p) => [p.id, p]));
  const slugToName = new Map(personas.map((p) => [p.slug, p.name]));
  const turnOrderRef = useRef(initialTurns.length);

  useEffect(() => {
    if (debate.status === "completed" || debate.status === "failed") return;
    const es = new EventSource(`${API_URL}/debates/${debateId}/stream`);
    type Ev =
      | { type: "phase_change"; phase: string }
      | {
          type: "turn_start";
          turnId: string;
          personaSlug: string | null;
          role: string;
          phase: string;
        }
      | { type: "turn_chunk"; turnId: string; delta: string }
      | { type: "turn_end"; turnId: string; tokenCount: number; costUsd: number }
      | { type: "synthesis_chunk"; delta: string }
      | { type: "complete"; totalCostUsd: number }
      | { type: "error"; message: string }
      | { type: "fact_check"; turnId: string; verdict: string; claim: string };
    es.onmessage = (e) => {
      let ev: Ev;
      try {
        ev = JSON.parse(e.data) as Ev;
      } catch {
        return;
      }
      switch (ev.type) {
        case "turn_start": {
          setTurns((prev) => {
            if (prev.some((t) => t.id === ev.turnId)) return prev;
            return [
              ...prev,
              {
                id: ev.turnId,
                personaId: null,
                phase: ev.phase,
                role: ev.role,
                content: "",
                turnOrder: turnOrderRef.current++,
                tokenCount: 0,
                costUsd: 0,
                isStreaming: true,
              },
            ];
          });
          break;
        }
        case "turn_chunk": {
          setTurns((prev) =>
            prev.map((t) => (t.id === ev.turnId ? { ...t, content: t.content + ev.delta } : t)),
          );
          break;
        }
        case "synthesis_chunk": {
          setSynthesisDelta((s) => s + ev.delta);
          setTurns((prev) =>
            prev.map((t) =>
              t.role === "synthesizer" ? { ...t, content: t.content + ev.delta } : t,
            ),
          );
          break;
        }
        case "turn_end": {
          setTurns((prev) =>
            prev.map((t) =>
              t.id === ev.turnId
                ? { ...t, isStreaming: false, tokenCount: ev.tokenCount, costUsd: ev.costUsd }
                : t,
            ),
          );
          break;
        }
        case "complete": {
          setDebate((d) => ({ ...d, status: "completed", totalCost: ev.totalCostUsd }));
          es.close();
          break;
        }
        case "error": {
          setDebate((d) => ({ ...d, status: "failed" }));
          es.close();
          break;
        }
      }
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [debateId, debate.status]);

  const lastPhase = turns.at(-1)?.phase ?? "framing";
  const phaseIndex = PHASE_ORDER.indexOf(lastPhase) + 1;

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        {debate.status === "running" && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            live
          </span>
        )}
        {debate.status === "completed" && (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-success)]">
            completed
          </span>
        )}
        {debate.status === "failed" && (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-danger)]">
            failed
          </span>
        )}
        <span className="font-mono text-[10px] text-[var(--color-muted)]">
          · total ${debate.totalCost.toFixed(4)}
        </span>
      </div>
      <PhaseBar phases={DEBATE_PHASES} currentIndex={phaseIndex} className="mb-12" />
      <Resolution text={debate.resolution} className="mb-12" />
      <Separator className="mb-12" />
      <div>
        {turns.map((turn, i) => {
          const persona = turn.personaId ? personaMap.get(turn.personaId) : undefined;
          const name =
            persona?.name ??
            (turn.role === "moderator"
              ? "Moderator"
              : turn.role === "synthesizer"
                ? "Synthesizer"
                : (slugToName.get(
                    (turn as TurnView & { personaSlug?: string }).personaSlug ?? "",
                  ) ?? "Speaker"));
          return (
            <div key={turn.id}>
              <DebateMessage
                personaName={name}
                phase={turn.phase.replace(/_/g, " ")}
                content={turn.content}
                isStreaming={turn.isStreaming}
              />
              {turn.tokenCount > 0 && (
                <div className="mb-4 font-mono text-[10px] text-[var(--color-muted)]">
                  {turn.tokenCount} tokens · ${turn.costUsd.toFixed(5)}
                </div>
              )}
              {i < turns.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
