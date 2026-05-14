interface TheaterPhaseBarProps {
  /** Index of current phase (0-5). */
  currentPhase?: number;
  totalPhases?: number;
}

export function TheaterPhaseBar({ currentPhase = 2, totalPhases = 6 }: TheaterPhaseBarProps) {
  const x1 = 40;
  const x2 = 640;
  const span = x2 - x1;
  const progress = Math.max(0, Math.min(1, (currentPhase + 1) / totalPhases));
  const fgX2 = x1 + span * progress;

  const tickXs: number[] = [];
  for (let i = 0; i < totalPhases; i++) {
    tickXs.push(x1 + (span / (totalPhases - 1)) * i);
  }

  return (
    <g>
      <line x1={x1} y1={52} x2={x2} y2={52} stroke="#1f1f24" strokeWidth={1} />
      <line x1={x1} y1={52} x2={fgX2} y2={52} stroke="#ea9518" strokeWidth={1} />
      {tickXs.map((tx) => (
        <line
          key={tx}
          x1={tx}
          y1={49}
          x2={tx}
          y2={54}
          stroke={tx <= fgX2 ? "#ea9518" : "#2a2a32"}
          strokeWidth={1}
        />
      ))}
    </g>
  );
}
