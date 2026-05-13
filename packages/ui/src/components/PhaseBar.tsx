"use client";
import { cn } from "../lib/utils.js";

interface PhaseBarProps {
  phases: string[];
  currentIndex: number;
  className?: string;
}

export function PhaseBar({ phases, currentIndex, className }: PhaseBarProps) {
  const progress = phases.length > 0 ? currentIndex / phases.length : 0;
  return (
    <div className={cn("relative h-px w-full bg-[oklch(0.24_0_0)]", className)}>
      {phases.map((phase, i) => (
        <div
          key={phase}
          className="absolute top-0 h-px w-px bg-[oklch(0.96_0_0/10%)]"
          style={{ left: `${(i / phases.length) * 100}%` }}
        />
      ))}
      <div
        className="absolute left-0 top-0 h-full bg-[oklch(0.78_0.13_75)] transition-all duration-[400ms] ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
