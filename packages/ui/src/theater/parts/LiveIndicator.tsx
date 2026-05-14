interface LiveIndicatorProps {
  watchingCount?: number;
  totalCostUsd?: number;
  reduceMotion?: boolean;
}

export function LiveIndicator({
  watchingCount = 47,
  totalCostUsd = 0.18,
  reduceMotion = false,
}: LiveIndicatorProps) {
  const meta = `· ${watchingCount} WATCHING · $${totalCostUsd.toFixed(2)} SPENT`;
  return (
    <g>
      <circle cx={40} cy={32} r={3.5} fill="#ea9518">
        {!reduceMotion && (
          <animate attributeName="opacity" values="1;0.25;1" dur="1.4s" repeatCount="indefinite" />
        )}
      </circle>
      <text
        x={52}
        y={35}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={10}
        fill="#ea9518"
        letterSpacing="0.1em"
      >
        LIVE
      </text>
      <text
        x={84}
        y={35}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={10}
        fill="#5a5a62"
        letterSpacing="0.1em"
      >
        {meta}
      </text>
    </g>
  );
}
