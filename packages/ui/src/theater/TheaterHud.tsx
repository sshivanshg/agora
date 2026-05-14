import { LiveIndicator } from "./parts/LiveIndicator";
import { TheaterPhaseBar } from "./parts/PhaseBar";

export interface TheaterHudProps {
  watchingCount?: number;
  totalCostUsd?: number;
  currentPhase?: number;
  totalPhases?: number;
  phaseLabel?: string;
  reduceMotion?: boolean;
}

export function TheaterHud({
  watchingCount = 47,
  totalCostUsd = 0.18,
  currentPhase = 2,
  totalPhases = 6,
  phaseLabel = "CROSS-EXAMINATION",
  reduceMotion = false,
}: TheaterHudProps) {
  const phaseText = `PHASE ${currentPhase + 1} OF ${totalPhases} · ${phaseLabel}`;
  return (
    <g>
      <LiveIndicator
        watchingCount={watchingCount}
        totalCostUsd={totalCostUsd}
        reduceMotion={reduceMotion}
      />
      <text
        x={640}
        y={35}
        textAnchor="end"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={10}
        fill="#5a5a62"
        letterSpacing="0.1em"
      >
        {phaseText}
      </text>
      <TheaterPhaseBar currentPhase={currentPhase} totalPhases={totalPhases} />
    </g>
  );
}
