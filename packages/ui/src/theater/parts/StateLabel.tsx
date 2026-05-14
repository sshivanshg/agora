interface StateLabelProps {
  cx: number;
  cy: number;
  /** Primary label (e.g., persona name). */
  primary: string;
  /** Secondary state line. */
  secondary: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export function StateLabel({
  cx,
  cy,
  primary,
  secondary,
  primaryColor = "#6a6a72",
  secondaryColor = "#5a5a62",
}: StateLabelProps) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <text
        x={0}
        y={0}
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={9.5}
        fill={primaryColor}
        letterSpacing="0.12em"
      >
        {primary}
      </text>
      <text
        x={0}
        y={14}
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize={10}
        fill={secondaryColor}
        letterSpacing="0.1em"
      >
        {secondary}
      </text>
    </g>
  );
}
