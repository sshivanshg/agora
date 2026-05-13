import { cn } from "../lib/utils.js";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("rounded-sm", className)}
      style={{
        background:
          "linear-gradient(90deg, oklch(0.18 0 0) 25%, oklch(0.22 0 0) 50%, oklch(0.18 0 0) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}
