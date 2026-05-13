"use client";
import { cn } from "../lib/utils.js";
import { PersonaLabel } from "./PersonaLabel.js";

interface DebateMessageProps {
  personaName: string;
  phase: string;
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function DebateMessage({
  personaName,
  phase,
  content,
  isStreaming,
  className,
}: DebateMessageProps) {
  return (
    <article className={cn("py-8", className)}>
      <div className="mb-3 flex items-center gap-2">
        <PersonaLabel name={personaName} state="active" />
        <span className="text-[oklch(0.55_0_0)]">·</span>
        <span className="font-mono text-xs uppercase tracking-[0.05em] text-[oklch(0.55_0_0)]">
          {phase}
        </span>
      </div>
      <p className="max-w-prose font-sans text-base leading-relaxed text-[oklch(0.96_0_0)]">
        {content}
        {isStreaming && (
          <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-[blink_1s_step-end_infinite] bg-[oklch(0.78_0.13_75)] align-text-bottom" />
        )}
      </p>
    </article>
  );
}
