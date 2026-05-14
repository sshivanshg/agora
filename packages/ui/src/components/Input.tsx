"use client";
import { Eye, EyeOff } from "lucide-react";
import { type InputHTMLAttributes, useState } from "react";
import { cn } from "../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
  variant?: "text" | "password";
}

export function Input({ className, mono, variant = "text", type, ...props }: InputProps) {
  const [show, setShow] = useState(false);
  const isPassword = variant === "password";
  const inputType = isPassword ? (show ? "text" : "password") : (type ?? "text");

  return (
    <div className="relative">
      <input
        type={inputType}
        className={cn(
          "h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] transition-all duration-150 ease-out focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50",
          mono && "font-mono text-xs tracking-wide",
          isPassword && "pr-10",
          className,
        )}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors duration-150"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
