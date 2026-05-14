"use client";
import { cn } from "../lib/utils";

interface ResolutionProps {
  text: string;
  eyebrow?: string;
  className?: string;
}

export function Resolution({ text, eyebrow = "RESOLUTION", className }: ResolutionProps) {
  return (
    <header className={cn("space-y-3", className)}>
      <p className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {eyebrow}
      </p>
      <h1 className="font-serif text-3xl leading-tight text-[var(--color-fg)] text-balance md:text-4xl">
        {text}
      </h1>
    </header>
  );
}
