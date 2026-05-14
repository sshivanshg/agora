"use client";
import { type VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-accent)] text-[var(--color-bg)] hover:opacity-90",
        ghost:
          "bg-transparent border border-[var(--color-border)] text-[var(--color-fg)] hover:border-[var(--color-muted)] hover:bg-[var(--color-bg-elev)]",
        mono: "font-mono uppercase tracking-[0.08em] text-xs bg-transparent text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-border)] border border-transparent",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
