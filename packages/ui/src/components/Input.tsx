import { Eye, EyeOff } from "lucide-react";
import { type InputHTMLAttributes, useState } from "react";
import { cn } from "../lib/utils.js";

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
          "h-10 w-full rounded-md border border-[oklch(0.24_0_0)] bg-[oklch(0.18_0_0)] px-3 text-sm text-[oklch(0.96_0_0)] placeholder:text-[oklch(0.55_0_0)] transition-all duration-150 ease-out focus:outline-none focus:border-[oklch(0.78_0.13_75/50%)] disabled:opacity-50",
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.55_0_0)] hover:text-[oklch(0.96_0_0)] transition-colors duration-150"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
