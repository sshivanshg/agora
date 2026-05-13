"use client";
import { cn } from "../lib/utils";

interface PersonaLabelProps {
  name: string;
  state: "active" | "idle" | "upcoming";
  className?: string;
}

export function PersonaLabel({ name, state, className }: PersonaLabelProps) {
  return (
    <span
      className={cn(
        "font-mono text-xs uppercase tracking-[0.08em] transition-opacity duration-200 ease-out",
        state === "active" && "text-[oklch(0.96_0_0)]",
        state === "idle" && "text-[oklch(0.55_0_0)]",
        state === "upcoming" && "text-[oklch(0.55_0_0)] opacity-50",
        className,
      )}
    >
      {name}
    </span>
  );
}
