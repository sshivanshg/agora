"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export function Accordion({ items, className }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className={cn("divide-y divide-[var(--color-border)]", className)}>
      {items.map((item, i) => (
        <div key={item.question}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-[var(--color-fg)] transition-colors hover:text-[var(--color-accent)]"
          >
            {item.question}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform duration-200",
                open === i && "rotate-180",
              )}
            />
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200 ease-out",
              open === i ? "max-h-96 pb-5" : "max-h-0",
            )}
          >
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
