interface SignalLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  state?: "dim" | "active";
  reduceMotion?: boolean;
}

export function SignalLine({
  x1,
  y1,
  x2,
  y2,
  state = "dim",
  reduceMotion = false,
}: SignalLineProps) {
  if (state === "active") {
    return (
      <g>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#ea9518"
          strokeWidth={0.8}
          opacity={0.7}
          fill="none"
          strokeDasharray="8 4"
        >
          {!reduceMotion && (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-12"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </line>
        {/* orchestrator endpoint - steady */}
        <circle cx={x1} cy={y1} r={2} fill="#ea9518" />
        {/* persona endpoint - pulse */}
        <circle cx={x2} cy={y2} r={2} fill="#ea9518">
          {!reduceMotion && (
            <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite" />
          )}
        </circle>
      </g>
    );
  }
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2a2a32" strokeWidth={0.6} fill="none" />
      <circle cx={x1} cy={y1} r={2} fill="#3a3a44" />
      <circle cx={x2} cy={y2} r={2} fill="#3a3a44" />
    </g>
  );
}
