"use client";
import { AnimatePresence, motion } from "motion/react";
import { type CSSProperties, type ReactNode, memo } from "react";
import { PulseRings } from "../parts/PulseRings";
import type { PersonaState } from "../types";

export type OrbSize = "sm" | "md" | "lg";

interface OrbProps {
  cx: number;
  cy: number;
  state: PersonaState;
  reduceMotion?: boolean;
  size?: OrbSize;
  children: ReactNode;
}

function strokeColorFor(state: PersonaState): string {
  switch (state) {
    case "speaking":
      return "#ea9518";
    case "error":
      return "#a8514d";
    default:
      return "#3a3a44";
  }
}

function dotColorFor(state: PersonaState): string {
  switch (state) {
    case "speaking":
      return "#ea9518";
    case "error":
      return "#a8514d";
    default:
      return "#4a4a52";
  }
}

function scaleFor(size: OrbSize): number {
  if (size === "sm") return 0.6;
  if (size === "lg") return 1.6;
  return 1;
}

function OrbInner({ cx, cy, state, reduceMotion = false, size = "md", children }: OrbProps) {
  const dim = state === "idle";
  const groupOpacity = dim ? 0.5 : 1;
  const motionPaused = state === "idle" || state === "error";
  const scale = scaleFor(size);

  const style: CSSProperties = {
    // CSS variables drive smooth color transitions across all inner [data-stroke] / [data-dot]
    ["--orb-stroke" as string]: strokeColorFor(state),
    ["--orb-dot" as string]: dotColorFor(state),
  };

  const transform =
    scale === 1 ? `translate(${cx}, ${cy})` : `translate(${cx}, ${cy}) scale(${scale})`;

  return (
    <g transform={transform}>
      <g
        className="theater-orb-group"
        style={style}
        data-state={state}
        data-motion-paused={motionPaused ? "true" : "false"}
        opacity={groupOpacity}
      >
        {/* outer frame */}
        <circle
          cx={0}
          cy={0}
          r={44}
          stroke="var(--orb-stroke)"
          strokeWidth={0.8}
          fill="none"
          data-stroke=""
        />
        <circle
          cx={0}
          cy={0}
          r={38}
          stroke="var(--orb-stroke)"
          strokeWidth={0.5}
          opacity={0.4}
          fill="none"
          data-stroke=""
        />

        {children}

        {/* upcoming ring */}
        <AnimatePresence>
          {state === "upcoming" ? (
            <motion.g
              key="upcoming-ring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <g>
                {!reduceMotion && (
                  <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="12s"
                    repeatCount="indefinite"
                  />
                )}
                <circle
                  cx={0}
                  cy={0}
                  r={50}
                  stroke="#ea9518"
                  strokeWidth={1}
                  fill="none"
                  strokeDasharray="60 20"
                />
              </g>
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* speaking pulse rings */}
        <PulseRings active={state === "speaking"} reduceMotion={reduceMotion} />

        {/* error caution glyph */}
        {state === "error" ? (
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize={14}
            fontWeight={700}
            fill="#a8514d"
          >
            !
          </text>
        ) : null}
      </g>
    </g>
  );
}

export const Orb = memo(OrbInner);
