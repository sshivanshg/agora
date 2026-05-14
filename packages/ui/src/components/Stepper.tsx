"use client";
import { cn } from "../lib/utils";

interface StepperProps {
  steps: string[];
  currentIndex: number;
  className?: string;
}

export function Stepper({ steps, currentIndex, className }: StepperProps) {
  return (
    <div className={cn("flex items-start gap-0", className)}>
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* line before */}
              <div
                className={cn(
                  "h-px flex-1",
                  i === 0
                    ? "opacity-0"
                    : isCompleted
                      ? "bg-[var(--color-accent)]"
                      : "bg-[var(--color-border)]",
                )}
              />
              {/* dot */}
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-150 ease-out",
                  isCompleted && "bg-[var(--color-accent)]",
                  isCurrent &&
                    "ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-bg)] bg-[var(--color-accent)]",
                  !isCompleted && !isCurrent && "bg-[var(--color-border)]",
                )}
              />
              {/* line after */}
              <div
                className={cn(
                  "h-px flex-1",
                  i === steps.length - 1
                    ? "opacity-0"
                    : isCompleted
                      ? "bg-[var(--color-accent)]"
                      : "bg-[var(--color-border)]",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-center",
                isCurrent
                  ? "text-[var(--color-fg)]"
                  : isCompleted
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted)]",
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
