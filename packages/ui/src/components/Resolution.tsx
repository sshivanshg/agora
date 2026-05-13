import { cn } from "../lib/utils.js";

interface ResolutionProps {
  text: string;
  eyebrow?: string;
  className?: string;
}

export function Resolution({ text, eyebrow = "RESOLUTION", className }: ResolutionProps) {
  return (
    <header className={cn("space-y-3", className)}>
      <p className="font-mono text-xs uppercase tracking-[0.08em] text-[oklch(0.55_0_0)]">
        {eyebrow}
      </p>
      <h1 className="font-serif text-3xl leading-tight text-[oklch(0.96_0_0)] text-balance md:text-4xl">
        {text}
      </h1>
    </header>
  );
}
