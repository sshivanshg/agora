import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

export function Card({ className, padding = "md", children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-[oklch(0.24_0_0)] bg-[oklch(0.18_0_0)] transition-colors duration-150 ease-out hover:border-[oklch(0.30_0_0)]",
        padding === "sm" && "p-4",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
