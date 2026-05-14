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
        state === "active" && "text-[var(--color-fg)]",
        state === "idle" && "text-[var(--color-muted)]",
        state === "upcoming" && "text-[var(--color-muted)] opacity-50",
        className,
      )}
    >
      {name}
    </span>
  );
}
