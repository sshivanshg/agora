import { memo } from "react";
import type { PersonaState } from "../types";
import { Orb, type OrbSize } from "./Orb";

const RINGS: Array<{ r: number; opacity: number; begin: string }> = [
  { r: 9, opacity: 1.0, begin: "0s" },
  { r: 16, opacity: 0.7, begin: "-1.5s" },
  { r: 24, opacity: 0.55, begin: "-3s" },
  { r: 32, opacity: 0.4, begin: "-4.5s" },
  { r: 38, opacity: 0.25, begin: "-6s" },
];

interface ProgressiveReformerOrbProps {
  cx: number;
  cy: number;
  state?: PersonaState;
  reduceMotion?: boolean;
  size?: OrbSize;
}

function ProgressiveReformerOrbInner({
  cx,
  cy,
  state = "listening",
  reduceMotion = false,
  size = "md",
}: ProgressiveReformerOrbProps) {
  const motionOn = !reduceMotion && state !== "idle" && state !== "error";
  const speaking = state === "speaking";
  const amp = speaking ? 3 : 1.5;
  const strokeWidth = speaking ? 1.2 : 0.8;

  return (
    <Orb cx={cx} cy={cy} state={state} reduceMotion={reduceMotion} size={size}>
      {RINGS.map((ring) => {
        const hi = ring.r + amp;
        const lo = ring.r - amp;
        const values = `${ring.r};${hi};${ring.r};${lo};${ring.r}`;
        return (
          <circle
            key={ring.r}
            cx={0}
            cy={0}
            r={ring.r}
            stroke="var(--orb-stroke)"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={ring.opacity}
            data-stroke=""
          >
            {motionOn && (
              <animate
                key={values}
                attributeName="r"
                values={values}
                dur="6s"
                repeatCount="indefinite"
                begin={ring.begin}
              />
            )}
          </circle>
        );
      })}
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

export const ProgressiveReformerOrb = memo(ProgressiveReformerOrbInner);
