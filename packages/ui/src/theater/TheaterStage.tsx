import type { Ref } from "react";
import { TheaterHud, type TheaterHudProps } from "./TheaterHud";
import { ClassicalLiberalOrb } from "./orbs/ClassicalLiberalOrb";
import { ConservativeTraditionalistOrb } from "./orbs/ConservativeTraditionalistOrb";
import { OrchestratorOrb } from "./orbs/OrchestratorOrb";
import { ProgressiveReformerOrb } from "./orbs/ProgressiveReformerOrb";
import { TechnocratOrb } from "./orbs/TechnocratOrb";
import { CornerTicks } from "./parts/CornerTicks";
import { SignalLine } from "./parts/SignalLine";
import { StateLabel } from "./parts/StateLabel";
import {
  type CardinalDirection,
  type OrchestratorState,
  PERSONA_STATE_LABEL,
  type PersonaSlug,
  type PersonaState,
} from "./types";

const ORCH = { cx: 340, cy: 248 };
const NW = { cx: 116, cy: 224 };
const NE = { cx: 564, cy: 224 };
const SW = { cx: 116, cy: 393 };
const SE = { cx: 564, cy: 393 };

const LABEL_OFFSET = 60;

const PERSONA_DIR: Record<PersonaSlug, CardinalDirection> = {
  classicalLiberal: "w",
  progressiveReformer: "e",
  conservativeTraditionalist: "w",
  technocrat: "e",
};

export type PersonaStates = Partial<Record<PersonaSlug, PersonaState>>;

const PERSONA_DISPLAY_NAME: Record<PersonaSlug, string> = {
  classicalLiberal: "The Classical Liberal",
  progressiveReformer: "The Progressive Reformer",
  conservativeTraditionalist: "The Conservative Traditionalist",
  technocrat: "The Technocrat",
};

export interface TheaterStageProps extends TheaterHudProps {
  personaStates?: PersonaStates;
  orchestratorState?: OrchestratorState;
  /** Which persona is currently speaking (for signal line + orchestrator port). */
  activePersona?: PersonaSlug | null;
  svgRef?: Ref<SVGSVGElement>;
}

export function TheaterStage({
  personaStates,
  orchestratorState = "idle",
  activePersona = null,
  svgRef,
  ...hud
}: TheaterStageProps) {
  const reduceMotion = hud.reduceMotion ?? false;
  const states: Record<PersonaSlug, PersonaState> = {
    classicalLiberal: personaStates?.classicalLiberal ?? "listening",
    progressiveReformer: personaStates?.progressiveReformer ?? "listening",
    conservativeTraditionalist: personaStates?.conservativeTraditionalist ?? "listening",
    technocrat: personaStates?.technocrat ?? "listening",
  };

  const lineState = (slug: PersonaSlug): "dim" | "active" =>
    activePersona === slug && states[slug] === "speaking" ? "active" : "dim";

  const activeDir: CardinalDirection | undefined = activePersona
    ? PERSONA_DIR[activePersona]
    : undefined;

  const phaseNumber = (hud.currentPhase ?? 0) + 1;
  const totalPhases = hud.totalPhases ?? 6;
  const phaseLabel = (hud.phaseLabel ?? "").toLowerCase();
  const speakerName = activePersona ? PERSONA_DISPLAY_NAME[activePersona] : null;
  const desc = speakerName
    ? `Phase ${phaseNumber} of ${totalPhases}, ${phaseLabel}. ${speakerName} is speaking.`
    : `Phase ${phaseNumber} of ${totalPhases}, ${phaseLabel}.`;

  return (
    <svg
      ref={svgRef}
      className="theater-svg"
      viewBox="0 0 680 640"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Agora theater stage"
    >
      <title>Live debate theater</title>
      <desc>{desc}</desc>
      <rect x={0} y={0} width={680} height={640} fill="var(--theater-bg)" />

      <CornerTicks />

      <TheaterHud {...hud} />

      {/* signal lines (under orchestrator) */}
      <SignalLine
        x1={ORCH.cx}
        y1={ORCH.cy}
        x2={NW.cx}
        y2={NW.cy}
        state={lineState("classicalLiberal")}
        reduceMotion={reduceMotion}
      />
      <SignalLine
        x1={ORCH.cx}
        y1={ORCH.cy}
        x2={NE.cx}
        y2={NE.cy}
        state={lineState("progressiveReformer")}
        reduceMotion={reduceMotion}
      />
      <SignalLine
        x1={ORCH.cx}
        y1={ORCH.cy}
        x2={SW.cx}
        y2={SW.cy}
        state={lineState("conservativeTraditionalist")}
        reduceMotion={reduceMotion}
      />
      <SignalLine
        x1={ORCH.cx}
        y1={ORCH.cy}
        x2={SE.cx}
        y2={SE.cy}
        state={lineState("technocrat")}
        reduceMotion={reduceMotion}
      />

      {/* orchestrator (occludes lines via bg fill) */}
      <OrchestratorOrb
        cx={ORCH.cx}
        cy={ORCH.cy}
        state={orchestratorState}
        {...(activeDir ? { activeDirection: activeDir } : {})}
        reduceMotion={reduceMotion}
      />

      {/* persona orbs */}
      <ClassicalLiberalOrb
        cx={NW.cx}
        cy={NW.cy}
        state={states.classicalLiberal}
        reduceMotion={reduceMotion}
      />
      <ProgressiveReformerOrb
        cx={NE.cx}
        cy={NE.cy}
        state={states.progressiveReformer}
        reduceMotion={reduceMotion}
      />
      <ConservativeTraditionalistOrb
        cx={SW.cx}
        cy={SW.cy}
        state={states.conservativeTraditionalist}
        reduceMotion={reduceMotion}
      />
      <TechnocratOrb cx={SE.cx} cy={SE.cy} state={states.technocrat} reduceMotion={reduceMotion} />

      {/* state labels */}
      <StateLabel
        cx={ORCH.cx}
        cy={ORCH.cy + LABEL_OFFSET}
        primary="ORCHESTRATOR"
        secondary={orchestratorState === "active" ? "ROUTING" : "MODERATOR · STANDBY"}
        primaryColor="#888892"
      />
      <StateLabel
        cx={NW.cx}
        cy={NW.cy + LABEL_OFFSET}
        primary="CLASSICAL LIBERAL"
        secondary={PERSONA_STATE_LABEL[states.classicalLiberal]}
        secondaryColor={
          states.classicalLiberal === "speaking" || states.classicalLiberal === "upcoming"
            ? "#ea9518"
            : states.classicalLiberal === "error"
              ? "#a8514d"
              : "#5a5a62"
        }
      />
      <StateLabel
        cx={NE.cx}
        cy={NE.cy + LABEL_OFFSET}
        primary="PROGRESSIVE REFORMER"
        secondary={PERSONA_STATE_LABEL[states.progressiveReformer]}
        secondaryColor={
          states.progressiveReformer === "speaking" || states.progressiveReformer === "upcoming"
            ? "#ea9518"
            : states.progressiveReformer === "error"
              ? "#a8514d"
              : "#5a5a62"
        }
      />
      <StateLabel
        cx={SW.cx}
        cy={SW.cy + LABEL_OFFSET}
        primary="CONSERVATIVE TRADITIONALIST"
        secondary={PERSONA_STATE_LABEL[states.conservativeTraditionalist]}
        secondaryColor={
          states.conservativeTraditionalist === "speaking" ||
          states.conservativeTraditionalist === "upcoming"
            ? "#ea9518"
            : states.conservativeTraditionalist === "error"
              ? "#a8514d"
              : "#5a5a62"
        }
      />
      <StateLabel
        cx={SE.cx}
        cy={SE.cy + LABEL_OFFSET}
        primary="TECHNOCRAT"
        secondary={PERSONA_STATE_LABEL[states.technocrat]}
        secondaryColor={
          states.technocrat === "speaking" || states.technocrat === "upcoming"
            ? "#ea9518"
            : states.technocrat === "error"
              ? "#a8514d"
              : "#5a5a62"
        }
      />
    </svg>
  );
}
