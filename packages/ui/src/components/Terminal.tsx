"use client";
import { cn } from "../lib/utils";

interface TerminalLine {
  type: "command" | "output" | "comment";
  text: string;
}

interface TerminalProps {
  lines: TerminalLine[];
  className?: string;
}

export function Terminal({ lines, className }: TerminalProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--color-border)] bg-[oklch(0.10_0_0)] font-mono text-xs",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.15_25)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.15_75)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.15_145)]" />
      </div>
      <div className="p-4 space-y-1">
        {lines.map((line, i) => (
          <div key={`${i}-${line.text}`} className="leading-relaxed">
            {line.type === "command" && (
              <span>
                <span className="text-[var(--color-accent)]">$ </span>
                <span className="text-[var(--color-fg)]">{line.text}</span>
              </span>
            )}
            {line.type === "output" && (
              <span className="text-[var(--color-muted)]">{line.text}</span>
            )}
            {line.type === "comment" && (
              <span className="text-[oklch(0.45_0_0)]"># {line.text}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
