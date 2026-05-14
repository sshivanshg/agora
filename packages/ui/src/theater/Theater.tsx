"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { TheaterMobile } from "./TheaterMobile";
import { TheaterSpeech, type TheaterSpeechProps } from "./TheaterSpeech";
import { TheaterStage, type TheaterStageProps } from "./TheaterStage";
import {
  type ApiPersonaSlug,
  type DebateStatus,
  PERSONA_DISPLAY_NAME,
  PHASE_LABELS,
  PHASE_ORDER,
  type Phase,
  type RecordedTurn,
  useTheaterState,
} from "./useTheaterState";
import "./theater.css";
import type { OrchestratorState, PersonaSlug, PersonaState } from "./types";

export interface TheaterProps {
  // Real-data mode
  debateId?: string;
  resolution?: string;
  initialTurns?: RecordedTurn[];
  initialPhase?: Phase;
  initialCostUsd?: number;
  initialStatus?: DebateStatus;
  apiUrl?: string;
  // Demo mode (Pass 3)
  demoMode?: boolean;
  // Overrides for storybook / preview
  stage?: Partial<TheaterStageProps>;
  speech?: Partial<TheaterSpeechProps>;
  watchingCount?: number;
}

type AllPersonaStates = Record<PersonaSlug, PersonaState>;

interface DemoStep {
  durationMs: number;
  personas: AllPersonaStates;
  orchestrator: OrchestratorState;
  activePersona: PersonaSlug | null;
  phase: number;
  phaseLabel: string;
  speech: {
    speakerLabel: string;
    body: string;
    turn: number;
  };
}

const PERSONA_DISPLAY: Record<PersonaSlug, string> = {
  classicalLiberal: "THE CLASSICAL LIBERAL",
  progressiveReformer: "THE PROGRESSIVE REFORMER",
  conservativeTraditionalist: "THE CONSERVATIVE TRADITIONALIST",
  technocrat: "THE TECHNOCRAT",
};

const PERSONA_PREVIEW: Record<PersonaSlug, string> = {
  classicalLiberal:
    "Liberty must come first. Any procedural reform that removes consent from individuals erodes the legitimacy of the chamber itself.",
  progressiveReformer:
    "The status quo has measurable harms, and incrementalism has run its course. We need structural change, deliberately and now.",
  conservativeTraditionalist:
    "Institutions carry knowledge that no single generation possesses. We do not discard them on a hypothesis.",
  technocrat:
    "Both prior speakers are arguing about the wrong question. The genuine constraint isn't ideology — it's that we have not measured what actually changes when sortition replaces election in a real legislative chamber.",
};

const ALL = (state: PersonaState): AllPersonaStates => ({
  classicalLiberal: state,
  progressiveReformer: state,
  conservativeTraditionalist: state,
  technocrat: state,
});

const API_TO_UI_SLUG: Record<ApiPersonaSlug, PersonaSlug> = {
  "classical-liberal": "classicalLiberal",
  "progressive-reformer": "progressiveReformer",
  "conservative-traditionalist": "conservativeTraditionalist",
  technocrat: "technocrat",
};

function speakingStep(
  slug: PersonaSlug,
  baseline: AllPersonaStates,
  upcoming: PersonaSlug | null,
  phase: number,
  phaseLabel: string,
  turn: number,
): DemoStep[] {
  const upcomingStep: DemoStep = {
    durationMs: 2000,
    personas: { ...baseline, [slug]: "upcoming" },
    orchestrator: "transitioning",
    activePersona: null,
    phase,
    phaseLabel,
    speech: {
      speakerLabel: `UP NEXT · ${PERSONA_DISPLAY[slug]}`,
      body: PERSONA_PREVIEW[slug],
      turn,
    },
  };
  const speakStep: DemoStep = {
    durationMs: 5000,
    personas: { ...baseline, [slug]: "speaking" },
    orchestrator: "active",
    activePersona: slug,
    phase,
    phaseLabel,
    speech: {
      speakerLabel: `NOW SPEAKING · ${PERSONA_DISPLAY[slug]}`,
      body: PERSONA_PREVIEW[slug],
      turn,
    },
  };
  const completeBase: AllPersonaStates = { ...baseline, [slug]: "complete" };
  const handoff: DemoStep = {
    durationMs: 1000,
    personas: upcoming ? { ...completeBase, [upcoming]: "upcoming" } : completeBase,
    orchestrator: "transitioning",
    activePersona: null,
    phase,
    phaseLabel,
    speech: {
      speakerLabel: upcoming
        ? `UP NEXT · ${PERSONA_DISPLAY[upcoming]}`
        : `COMPLETE · ${PERSONA_DISPLAY[slug]}`,
      body: upcoming ? PERSONA_PREVIEW[upcoming] : PERSONA_PREVIEW[slug],
      turn,
    },
  };
  return [upcomingStep, speakStep, handoff];
}

function buildDemoSequence(): DemoStep[] {
  const idleAll: DemoStep = {
    durationMs: 3000,
    personas: ALL("idle"),
    orchestrator: "idle",
    activePersona: null,
    phase: 0,
    phaseLabel: "STANDBY",
    speech: {
      speakerLabel: "STANDBY · DEBATE NOT STARTED",
      body: "Awaiting framing pass…",
      turn: 0,
    },
  };
  const listeningAll: DemoStep = {
    durationMs: 3000,
    personas: ALL("listening"),
    orchestrator: "active",
    activePersona: null,
    phase: 1,
    phaseLabel: "FRAMING",
    speech: {
      speakerLabel: "FRAMING · ORCHESTRATOR",
      body: "Resolution accepted. Cross-examination begins.",
      turn: 1,
    },
  };

  const baseAfterCL: AllPersonaStates = ALL("listening");
  const sequence: DemoStep[] = [idleAll, listeningAll];

  sequence.push(
    ...speakingStep("classicalLiberal", baseAfterCL, "progressiveReformer", 2, "OPENING", 2),
  );
  const baseAfterPR: AllPersonaStates = { ...baseAfterCL, classicalLiberal: "complete" };
  sequence.push(
    ...speakingStep(
      "progressiveReformer",
      baseAfterPR,
      "conservativeTraditionalist",
      2,
      "OPENING",
      3,
    ),
  );
  const baseAfterCT: AllPersonaStates = { ...baseAfterPR, progressiveReformer: "complete" };
  sequence.push(
    ...speakingStep(
      "conservativeTraditionalist",
      baseAfterCT,
      "technocrat",
      3,
      "CROSS-EXAMINATION",
      4,
    ),
  );
  const baseAfterTC: AllPersonaStates = { ...baseAfterCT, conservativeTraditionalist: "complete" };
  sequence.push(...speakingStep("technocrat", baseAfterTC, null, 3, "CROSS-EXAMINATION", 5));

  const finalComplete: DemoStep = {
    durationMs: 3000,
    personas: ALL("complete"),
    orchestrator: "idle",
    activePersona: null,
    phase: 5,
    phaseLabel: "RESOLUTION",
    speech: {
      speakerLabel: "DEBATE COMPLETE",
      body: "All personas have concluded their final turns.",
      turn: 16,
    },
  };
  sequence.push(finalComplete);

  return sequence;
}

const DEMO_SEQUENCE: DemoStep[] = buildDemoSequence();

interface TheaterViewModel {
  personaStates: AllPersonaStates;
  orchestratorState: OrchestratorState;
  activePersona: PersonaSlug | null;
  phaseIndex: number;
  phaseLabel: string;
  totalCostUsd: number;
  watchingCount: number;
  speakerLabel: string;
  body: string;
  isStreaming: boolean;
  turnNumber: number;
  totalTurns: number;
  tokens: number;
  isLive: boolean;
}

export function Theater(props: TheaterProps = {}) {
  const {
    debateId,
    resolution,
    initialTurns,
    initialPhase,
    initialCostUsd,
    initialStatus,
    apiUrl,
    demoMode = false,
    stage,
    speech,
    watchingCount: watchingCountOverride,
  } = props;

  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Real-data state — only effective when we have a debateId AND not in demo mode
  const realState = useTheaterState({
    debateId: debateId ?? "",
    apiUrl: apiUrl ?? "",
    initialTurns,
    initialPhase,
    initialCostUsd,
    initialStatus,
    // Disable SSE entirely when we're in demo mode or when there's no debateId.
    // We do this by passing a fake completed status.
    ...(demoMode || !debateId ? { initialStatus: "completed" as const } : {}),
  });

  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mql) return;
    setReduceMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia?.("(max-width: 767px)");
    if (!mql) return;
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      const svg = svgRef.current;
      if (!svg) return;
      if (document.hidden) {
        svg.pauseAnimations?.();
      } else {
        svg.unpauseAnimations?.();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!demoMode) return;
    const current = DEMO_SEQUENCE[demoStepIndex];
    if (!current) return;
    const timeout = setTimeout(() => {
      setDemoStepIndex((idx) => (idx + 1) % DEMO_SEQUENCE.length);
    }, current.durationMs);
    return () => clearTimeout(timeout);
  }, [demoMode, demoStepIndex]);

  const vm: TheaterViewModel = useMemo(() => {
    if (demoMode) {
      const step = DEMO_SEQUENCE[demoStepIndex] ?? DEMO_SEQUENCE[0];
      if (!step) {
        // Should never happen; appease TS
        return {
          personaStates: ALL("listening"),
          orchestratorState: "idle" as OrchestratorState,
          activePersona: null,
          phaseIndex: 0,
          phaseLabel: "STANDBY",
          totalCostUsd: 0,
          watchingCount: 0,
          speakerLabel: "",
          body: "",
          isStreaming: false,
          turnNumber: 0,
          totalTurns: 16,
          tokens: 0,
          isLive: false,
        };
      }
      return {
        personaStates: step.personas,
        orchestratorState: step.orchestrator,
        activePersona: step.activePersona,
        phaseIndex: step.phase,
        phaseLabel: step.phaseLabel,
        totalCostUsd: 0.18,
        watchingCount: watchingCountOverride ?? 47,
        speakerLabel: step.speech.speakerLabel,
        body: step.speech.body,
        isStreaming: false,
        turnNumber: step.speech.turn,
        totalTurns: 16,
        tokens: 847,
        isLive: true,
      };
    }

    // Real-data mode
    const personaStates: AllPersonaStates = {
      classicalLiberal: realState.personaStates["classical-liberal"],
      progressiveReformer: realState.personaStates["progressive-reformer"],
      conservativeTraditionalist: realState.personaStates["conservative-traditionalist"],
      technocrat: realState.personaStates.technocrat,
    };
    const activePersona: PersonaSlug | null = realState.activeSlug
      ? API_TO_UI_SLUG[realState.activeSlug]
      : null;
    const orchestratorState: OrchestratorState = realState.isComplete
      ? "idle"
      : realState.activeSlug
        ? "active"
        : realState.isLive
          ? "transitioning"
          : "idle";
    const phaseIndex = PHASE_ORDER.indexOf(realState.phase);
    const phaseLabel = PHASE_LABELS[realState.phase];

    // Choose which turn drives the speech panel
    const speakingTurn = realState.speakingTurnId
      ? realState.turns.find((t) => t.id === realState.speakingTurnId)
      : undefined;
    const synthTurn =
      realState.phase === "synthesis"
        ? [...realState.turns].reverse().find((t) => t.role === "synthesizer")
        : undefined;
    const latestDebater = [...realState.turns].reverse().find((t) => t.role === "debater");
    const focusTurn = speakingTurn ?? synthTurn ?? latestDebater;

    let speakerLabel: string;
    if (focusTurn) {
      if (focusTurn.role === "synthesizer") {
        speakerLabel = focusTurn.isStreaming ? "NOW SYNTHESIZING" : "SYNTHESIS · COMPLETE";
      } else if (focusTurn.role === "moderator") {
        speakerLabel = focusTurn.isStreaming ? "NOW SPEAKING · MODERATOR" : "MODERATOR";
      } else if (focusTurn.personaSlug) {
        const name = PERSONA_DISPLAY_NAME[focusTurn.personaSlug];
        speakerLabel = focusTurn.isStreaming ? `NOW SPEAKING · ${name}` : name;
      } else {
        speakerLabel = focusTurn.isStreaming ? "NOW SPEAKING" : "";
      }
    } else if (realState.isLive) {
      speakerLabel = "STANDBY · DEBATE STARTING";
    } else {
      speakerLabel = "STANDBY";
    }

    const body = focusTurn?.content ?? "";
    const isStreaming = focusTurn?.isStreaming ?? false;
    const turnNumber = focusTurn ? realState.turns.indexOf(focusTurn) + 1 : 0;

    return {
      personaStates,
      orchestratorState,
      activePersona,
      phaseIndex: phaseIndex < 0 ? 0 : phaseIndex,
      phaseLabel,
      totalCostUsd: realState.totalCostUsd,
      watchingCount: watchingCountOverride ?? realState.watchingCount,
      speakerLabel,
      body,
      isStreaming,
      turnNumber,
      totalTurns: Math.max(realState.turns.length, 16),
      tokens: focusTurn?.tokenCount ?? 0,
      isLive: realState.isLive,
    };
  }, [demoMode, demoStepIndex, realState, watchingCountOverride]);

  // Live-region announcements
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncedSpeakerRef = useRef<PersonaSlug | null>(null);
  const lastAnnouncedPhaseRef = useRef<string>("");
  useEffect(() => {
    if (lastAnnouncedPhaseRef.current !== vm.phaseLabel && vm.phaseLabel) {
      lastAnnouncedPhaseRef.current = vm.phaseLabel;
      setAnnouncement(
        `Phase ${vm.phaseIndex + 1} of 6: ${vm.phaseLabel.replace(/_/g, " ").toLowerCase()}`,
      );
      return;
    }
    if (lastAnnouncedSpeakerRef.current !== vm.activePersona) {
      lastAnnouncedSpeakerRef.current = vm.activePersona;
      if (vm.activePersona) {
        setAnnouncement(`Now speaking: ${PERSONA_DISPLAY[vm.activePersona]}`);
      }
    }
  }, [vm.activePersona, vm.phaseLabel, vm.phaseIndex]);

  const stageProps: TheaterStageProps = {
    ...stage,
    personaStates: vm.personaStates,
    orchestratorState: vm.orchestratorState,
    activePersona: vm.activePersona,
    currentPhase: vm.phaseIndex,
    phaseLabel: vm.phaseLabel,
    totalPhases: 6,
    totalCostUsd: vm.totalCostUsd,
    watchingCount: vm.watchingCount,
    reduceMotion,
  };

  const speechProps: TheaterSpeechProps = {
    ...speech,
    speakerLabel: vm.speakerLabel,
    body: vm.body || (speech?.body ?? ""),
    resolution: resolution ?? speech?.resolution,
    turn: vm.turnNumber,
    totalTurns: vm.totalTurns,
    tokens: vm.tokens,
    showCursor: vm.isStreaming,
    isStreaming: vm.isStreaming,
    reduceMotion,
  };

  return (
    <div className="theater">
      <div className="theater-sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {isMobile ? (
        <TheaterMobile
          personaStates={vm.personaStates}
          orchestratorState={vm.orchestratorState}
          activePersona={vm.activePersona}
          reduceMotion={reduceMotion}
          watchingCount={vm.watchingCount}
          totalCostUsd={vm.totalCostUsd}
          currentPhase={vm.phaseIndex}
          totalPhases={6}
          phaseLabel={vm.phaseLabel}
          isLive={vm.isLive}
        />
      ) : (
        <div className="theater-stage-wrap">
          <TheaterStage {...stageProps} svgRef={svgRef} />
        </div>
      )}
      <TheaterSpeech {...speechProps} />
    </div>
  );
}
