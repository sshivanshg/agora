import { memo } from "react";
import type { PersonaState } from "../types";
import { Orb, type OrbSize } from "./Orb";

const NODES = {
  A: { x: -22, y: -19, r: 2.5 },
  B: { x: 0, y: -8, r: 3.5 },
  C: { x: 19, y: -22, r: 2.5 },
  D: { x: -15, y: 12, r: 2.5 },
  E: { x: 14, y: 19, r: 2.5 },
  F: { x: 22, y: -3, r: 2.5 },
} as const;

type NodeKey = keyof typeof NODES;

const EDGES: Array<[NodeKey, NodeKey]> = [
  ["A", "B"],
  ["B", "C"],
  ["A", "D"],
  ["D", "E"],
  ["E", "F"],
  ["C", "F"],
  ["B", "D"],
  ["B", "F"],
];

interface TechnocratOrbProps {
  cx: number;
  cy: number;
  state?: PersonaState;
  reduceMotion?: boolean;
  size?: OrbSize;
}

function TechnocratOrbInner({
  cx,
  cy,
  state = "listening",
  reduceMotion = false,
  size = "md",
}: TechnocratOrbProps) {
  const motionOn = !reduceMotion && state !== "idle" && state !== "error";
  const speaking = state === "speaking";
  const edgeWidth = speaking ? 1.2 : 0.8;
  const dur = speaking ? "11s" : "22s";

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
        {EDGES.map(([a, b]) => {
          const na = NODES[a];
          const nb = NODES[b];
          return (
            <line
              key={`${a}-${b}`}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke="var(--orb-stroke)"
              strokeWidth={edgeWidth}
              data-stroke=""
            />
          );
        })}
        {(Object.keys(NODES) as NodeKey[]).map((k) => {
          const n = NODES[k];
          const isB = k === "B";
          return (
            <circle key={k} cx={n.x} cy={n.y} r={n.r} fill="var(--orb-dot)" data-dot="">
              {isB && motionOn ? (
                <animate attributeName="r" values="3;5;3" dur="1.4s" repeatCount="indefinite" />
              ) : null}
              {isB && state === "complete" && !reduceMotion ? (
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
          );
        })}
      </g>
    </Orb>
  );
}

export const TechnocratOrb = memo(TechnocratOrbInner);
