import type { CardinalDirection, OrchestratorState } from "../types";

interface OrchestratorOrbProps {
  cx: number;
  cy: number;
  state?: OrchestratorState;
  activeDirection?: CardinalDirection;
  reduceMotion?: boolean;
}

export function OrchestratorOrb({
  cx,
  cy,
  state = "idle",
  activeDirection,
  reduceMotion = false,
}: OrchestratorOrbProps) {
  const active = state === "active";
  const portColor = (dir: CardinalDirection): string =>
    active && activeDirection === dir ? "#ea9518" : "#888892";

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle cx={0} cy={0} r={36} stroke="#3a3a44" strokeWidth={0.5} fill="var(--theater-bg)" />
      <circle cx={0} cy={0} r={28} stroke="#3a3a44" strokeWidth={0.8} fill="none" opacity={0.6}>
        {!reduceMotion && (
          <animate
            attributeName="opacity"
            values="0.6;0.5;0.6;0.7;0.6"
            dur="8s"
            repeatCount="indefinite"
            begin="0s"
          />
        )}
      </circle>
      <circle cx={0} cy={0} r={20} stroke="#3a3a44" strokeWidth={0.8} fill="none" opacity={0.75}>
        {!reduceMotion && (
          <animate
            attributeName="opacity"
            values="0.75;0.65;0.75;0.85;0.75"
            dur="8s"
            repeatCount="indefinite"
            begin="-2.7s"
          />
        )}
      </circle>
      <circle cx={0} cy={0} r={12} stroke="#3a3a44" strokeWidth={0.8} fill="none" opacity={0.9}>
        {!reduceMotion && (
          <animate
            attributeName="opacity"
            values="0.9;0.8;0.9;1;0.9"
            dur="8s"
            repeatCount="indefinite"
            begin="-5.3s"
          />
        )}
      </circle>
      <circle cx={0} cy={0} r={4} fill="#888892">
        {!reduceMotion && (
          <animate attributeName="r" values="3.5;5;3.5" dur="2.2s" repeatCount="indefinite" />
        )}
      </circle>
      <line x1={0} y1={-36} x2={0} y2={-40} stroke={portColor("n")} strokeWidth={0.5} />
      <line x1={36} y1={0} x2={40} y2={0} stroke={portColor("e")} strokeWidth={0.5} />
      <line x1={0} y1={36} x2={0} y2={40} stroke={portColor("s")} strokeWidth={0.5} />
      <line x1={-36} y1={0} x2={-40} y2={0} stroke={portColor("w")} strokeWidth={0.5} />
    </g>
  );
}
