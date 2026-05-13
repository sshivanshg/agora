"use client";
import { cn } from "../lib/utils";
import { PersonaMonogram } from "./PersonaMonogram";

interface PersonaCardProps {
  name: string;
  worldviewTag: string;
  slug: string;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function PersonaCard({
  name,
  worldviewTag,
  slug: _slug,
  isActive = true,
  className,
  onClick,
}: PersonaCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-4 rounded-lg border p-5 text-left transition-all duration-150 cursor-pointer",
        "border-[var(--color-border)] bg-[var(--color-bg-elev)]",
        "hover:border-[var(--color-muted)] hover:bg-[var(--color-bg)]",
        !isActive && "opacity-50",
        className,
      )}
    >
      <PersonaMonogram name={name} size="lg" />
      <div>
        <p className="font-medium text-[var(--color-fg)] text-sm">{name}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
          {worldviewTag}
        </p>
      </div>
    </button>
  );
}
