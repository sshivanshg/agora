import { cn } from "../lib/utils.js";

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
                      ? "bg-[oklch(0.78_0.13_75)]"
                      : "bg-[oklch(0.24_0_0)]",
                )}
              />
              {/* dot */}
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-150 ease-out",
                  isCompleted && "bg-[oklch(0.78_0.13_75)]",
                  isCurrent &&
                    "ring-2 ring-[oklch(0.78_0.13_75)] ring-offset-1 ring-offset-[oklch(0.14_0_0)] bg-[oklch(0.78_0.13_75)]",
                  !isCompleted && !isCurrent && "bg-[oklch(0.24_0_0)]",
                )}
              />
              {/* line after */}
              <div
                className={cn(
                  "h-px flex-1",
                  i === steps.length - 1
                    ? "opacity-0"
                    : isCompleted
                      ? "bg-[oklch(0.78_0.13_75)]"
                      : "bg-[oklch(0.24_0_0)]",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-center",
                isCurrent
                  ? "text-[oklch(0.96_0_0)]"
                  : isCompleted
                    ? "text-[oklch(0.78_0.13_75)]"
                    : "text-[oklch(0.55_0_0)]",
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
