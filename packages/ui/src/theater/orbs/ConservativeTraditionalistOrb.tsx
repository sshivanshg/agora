import { memo } from "react";
import type { PersonaState } from "../types";
import { Orb, type OrbSize } from "./Orb";

const ARCS: Array<{ y: number; opacity: number; begin: string }> = [
  { y: -18, opacity: 1.0, begin: "0s" },
  { y: -8, opacity: 0.8, begin: "-1.6s" },
  { y: 1, opacity: 0.7, begin: "-3.2s" },
  { y: 9, opacity: 0.6, begin: "-4.8s" },
  { y: 17, opacity: 0.5, begin: "-6.4s" },
];

interface ConservativeTraditionalistOrbProps {
  cx: number;
  cy: number;
  state?: PersonaState;
  reduceMotion?: boolean;
  size?: OrbSize;
}

function ConservativeTraditionalistOrbInner({
  cx,
  cy,
  state = "listening",
  reduceMotion = false,
  size = "md",
}: ConservativeTraditionalistOrbProps) {
  const motionOn = !reduceMotion && state !== "idle" && state !== "error";
  const speaking = state === "speaking";
  const drift = speaking ? 1.6 : 0.8;
  // Control point curvature delta: -10 baseline; -14 in speaking.
  const cpY = speaking ? 14 : 10;
  const strokeWidth = speaking ? 1.2 : 0.8;
  const driftValues = `0,-${drift}; 0,${drift}; 0,-${drift}`;

  return (
    <Orb cx={cx} cy={cy} state={state} reduceMotion={reduceMotion} size={size}>
      {ARCS.map((arc) => (
        <g key={arc.y}>
          <path
            d={`M -30 ${arc.y} Q 0 ${arc.y - cpY} 30 ${arc.y}`}
            stroke="var(--orb-stroke)"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={arc.opacity}
            data-stroke=""
          />
          {motionOn && (
            <animateTransform
              key={driftValues}
              attributeName="transform"
              attributeType="XML"
              type="translate"
              values={driftValues}
              dur="8s"
              repeatCount="indefinite"
              begin={arc.begin}
            />
          )}
        </g>
      ))}
      <circle cx={0} cy={0} r={2.5} fill="var(--orb-dot)" data-dot="">
        {speaking && !reduceMotion ? (
          <animate attributeName="r" values="2.5;3.25;2.5" dur="1.4s" repeatCount="indefinite" />
        ) : null}
        {state === "complete" && !reduceMotion ? (
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="5s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
            keyTimes="0;0.5;1"
          />
        ) : null}
      </circle>
    </Orb>
  );
}

export const ConservativeTraditionalistOrb = memo(ConservativeTraditionalistOrbInner);
