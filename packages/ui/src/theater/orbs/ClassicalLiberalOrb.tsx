import { memo } from "react";
import type { PersonaState } from "../types";
import { Orb, type OrbSize } from "./Orb";

interface ClassicalLiberalOrbProps {
  cx: number;
  cy: number;
  state?: PersonaState;
  reduceMotion?: boolean;
  size?: OrbSize;
}

function ClassicalLiberalOrbInner({
  cx,
  cy,
  state = "listening",
  reduceMotion = false,
  size = "md",
}: ClassicalLiberalOrbProps) {
  const motionOn = !reduceMotion && state !== "idle" && state !== "error";
  const speaking = state === "speaking";
  const strokeWidth = speaking ? 1.2 : 1;
  const innerStrokeWidth = speaking ? 0.9 : 0.7;
  const dur = speaking ? "22s" : "42s";

  return (
    <Orb cx={cx} cy={cy} state={state} reduceMotion={reduceMotion} size={size}>
      <g style={{ willChange: "transform" }}>
        {motionOn && (
          <animateTransform
            key={dur}
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0"
            to="360"
            dur={dur}
            repeatCount="indefinite"
          />
        )}
        <polygon
          points="22,0 11,-19.05 -11,-19.05 -22,0 -11,19.05 11,19.05"
          stroke="var(--orb-stroke)"
          strokeWidth={strokeWidth}
          fill="none"
          data-stroke=""
        />
        <line
          x1={22}
          y1={0}
          x2={-22}
          y2={0}
          stroke="var(--orb-stroke)"
          strokeWidth={innerStrokeWidth}
          opacity={0.7}
          data-stroke=""
        />
        <line
          x1={11}
          y1={-19.05}
          x2={-11}
          y2={19.05}
          stroke="var(--orb-stroke)"
          strokeWidth={innerStrokeWidth}
          opacity={0.7}
          data-stroke=""
        />
        <line
          x1={-11}
          y1={-19.05}
          x2={11}
          y2={19.05}
          stroke="var(--orb-stroke)"
          strokeWidth={innerStrokeWidth}
          opacity={0.7}
          data-stroke=""
        />
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
      </g>
    </Orb>
  );
}

export const ClassicalLiberalOrb = memo(ClassicalLiberalOrbInner);
