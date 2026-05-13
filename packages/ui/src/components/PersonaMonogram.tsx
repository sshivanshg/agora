"use client";
import { cn } from "../lib/utils";

interface PersonaMonogramProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const COLORS = [
  "oklch(0.65 0.15 25)",
  "oklch(0.65 0.15 145)",
  "oklch(0.65 0.15 260)",
  "oklch(0.65 0.15 320)",
  "oklch(0.65 0.15 75)",
  "oklch(0.65 0.15 200)",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" };

export function PersonaMonogram({ name, size = "md", className }: PersonaMonogramProps) {
  const color = getColor(name);
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-mono font-medium tracking-wider",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {getInitials(name)}
    </div>
  );
}
