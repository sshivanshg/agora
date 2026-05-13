"use client";
import { cn } from "../lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-24 text-center", className)}>
      {icon && <div className="mb-4 text-[var(--color-muted)]">{icon}</div>}
      <h3 className="text-sm font-medium text-[var(--color-fg)]">{title}</h3>
      {description && <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
