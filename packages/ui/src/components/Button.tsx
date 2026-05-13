import { type VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[oklch(0.78_0.13_75)]",
  {
    variants: {
      variant: {
        primary: "bg-[oklch(0.78_0.13_75)] text-[oklch(0.14_0_0)] hover:opacity-90",
        ghost:
          "bg-transparent border border-[oklch(0.24_0_0)] text-[oklch(0.96_0_0)] hover:border-[oklch(0.35_0_0)] hover:bg-[oklch(0.18_0_0)]",
        mono: "font-mono uppercase tracking-[0.08em] text-xs bg-transparent text-[oklch(0.55_0_0)] hover:text-[oklch(0.96_0_0)] hover:border-[oklch(0.24_0_0)] border border-transparent",
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
