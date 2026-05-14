"use client";
import { motion } from "motion/react";
import { ClassicalLiberalOrb } from "./orbs/ClassicalLiberalOrb";
import { ConservativeTraditionalistOrb } from "./orbs/ConservativeTraditionalistOrb";
import { OrchestratorOrb } from "./orbs/OrchestratorOrb";
import { ProgressiveReformerOrb } from "./orbs/ProgressiveReformerOrb";
import { TechnocratOrb } from "./orbs/TechnocratOrb";
import type { OrchestratorState, PersonaSlug, PersonaState } from "./types";

export interface TheaterMobileProps {
  personaStates: Record<PersonaSlug, PersonaState>;
  orchestratorState: OrchestratorState;
  activePersona: PersonaSlug | null;
  reduceMotion?: boolean;
  watchingCount: number;
  totalCostUsd: number;
  currentPhase: number;
  totalPhases: number;
  phaseLabel: string;
  isLive: boolean;
}

const PERSONA_ORDER: PersonaSlug[] = [
  "classicalLiberal",
  "progressiveReformer",
  "conservativeTraditionalist",
  "technocrat",
];

const PERSONA_LABEL: Record<PersonaSlug, string> = {
  classicalLiberal: "CLASSICAL LIBERAL",
  progressiveReformer: "PROGRESSIVE REFORMER",
  conservativeTraditionalist: "CONSERVATIVE TRADITIONALIST",
  technocrat: "TECHNOCRAT",
};

function PersonaOrb({
  slug,
  state,
  reduceMotion,
  size,
}: {
  slug: PersonaSlug;
  state: PersonaState;
  reduceMotion: boolean;
  size: "sm" | "md" | "lg";
}) {
  const common = { cx: 0, cy: 0, state, reduceMotion, size } as const;
  switch (slug) {
    case "classicalLiberal":
      return <ClassicalLiberalOrb {...common} />;
    case "progressiveReformer":
      return <ProgressiveReformerOrb {...common} />;
    case "conservativeTraditionalist":
      return <ConservativeTraditionalistOrb {...common} />;
    case "technocrat":
      return <TechnocratOrb {...common} />;
    default:
      return null;
  }
}

export function TheaterMobile({
  personaStates,
  orchestratorState,
  activePersona,
  reduceMotion = false,
  watchingCount,
  totalCostUsd,
  currentPhase,
  totalPhases,
  phaseLabel,
  isLive,
}: TheaterMobileProps) {
  const listeners = PERSONA_ORDER.filter((slug) => slug !== activePersona);
  const spotlightSize = 200;

  return (
    <div className="theater-mobile">
      {/* Mobile HUD */}
      <div className="theater-mobile-hud">
        <div className="theater-mobile-hud-row">
          {isLive ? (
            <span className="theater-mobile-hud-live">
              <span
                className={
                  reduceMotion ? "theater-mobile-hud-dot" : "theater-mobile-hud-dot is-live"
                }
              />
              LIVE
            </span>
          ) : null}
          <span>
            {watchingCount} WATCHING · ${totalCostUsd.toFixed(2)}
          </span>
        </div>
        <div className="theater-mobile-hud-row">
          PHASE {currentPhase + 1} OF {totalPhases} · {phaseLabel}
        </div>
      </div>

      {/* Spotlight: active speaker or orchestrator */}
      <svg
        className="theater-mobile-spotlight"
        viewBox={`-${spotlightSize / 2} -${spotlightSize / 2} ${spotlightSize} ${spotlightSize}`}
        role="img"
        aria-label={
          activePersona ? `Now speaking: ${PERSONA_LABEL[activePersona]}` : "Orchestrator"
        }
      >
        {activePersona ? (
          <PersonaOrb
            slug={activePersona}
            state={personaStates[activePersona]}
            reduceMotion={reduceMotion}
            size="lg"
          />
        ) : (
          <g transform="scale(1.6)">
            <OrchestratorOrb cx={0} cy={0} state={orchestratorState} reduceMotion={reduceMotion} />
          </g>
        )}
      </svg>

      {/* Listeners strip */}
      <div className="theater-mobile-listeners">
        {listeners.map((slug) => (
          <svg
            key={slug}
            className="theater-mobile-listener"
            viewBox="-44 -44 88 88"
            role="img"
            aria-label={PERSONA_LABEL[slug]}
          >
            <PersonaOrb
              slug={slug}
              state={personaStates[slug]}
              reduceMotion={reduceMotion}
              size="sm"
            />
          </svg>
        ))}
      </div>

      {/* Mini orchestrator strip */}
      <div className="theater-mobile-strip" aria-hidden="true">
        <div className="theater-mobile-strip-line" />
        {reduceMotion ? (
          <div className="theater-mobile-strip-dot" style={{ left: "50%" }} />
        ) : (
          <motion.div
            className="theater-mobile-strip-dot"
            initial={{ left: "0%" }}
            animate={{ left: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  );
}
