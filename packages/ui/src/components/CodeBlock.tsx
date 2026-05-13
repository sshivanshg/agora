"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "bash", className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)]",
        className,
      )}
    >
      {language && (
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {language}
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "copied" : "copy"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[var(--color-fg)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
