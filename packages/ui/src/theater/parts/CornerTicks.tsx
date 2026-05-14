export function CornerTicks() {
  const stroke = "#2a2a32";
  const sw = 0.5;
  return (
    <g fill="none" stroke={stroke} strokeWidth={sw}>
      <polyline points="40,46 40,30 56,30" />
      <polyline points="624,30 640,30 640,46" />
      <polyline points="40,594 40,610 56,610" />
      <polyline points="624,610 640,610 640,594" />
    </g>
  );
}
