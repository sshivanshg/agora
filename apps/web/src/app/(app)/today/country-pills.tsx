"use client";

import { HelpCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "agora.country";

const COUNTRIES: { value: string; label: string }[] = [
  { value: "global", label: "Global" },
  { value: "in", label: "India" },
  { value: "us", label: "US" },
  { value: "uk", label: "UK" },
  { value: "eu", label: "EU" },
  { value: "br", label: "Brazil" },
  { value: "more", label: "More" },
];

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface CountryPillsProps {
  initialCountry?: string;
}

export function CountryPills({ initialCountry }: CountryPillsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlCountry = searchParams?.get("country") ?? null;
  const [active, setActive] = useState<string>(urlCountry ?? initialCountry ?? "global");

  // On mount: if URL has no country param, read from localStorage and apply
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only sync
  useEffect(() => {
    if (urlCountry) {
      try {
        window.localStorage.setItem(STORAGE_KEY, urlCountry);
      } catch {
        // ignore
      }
      setActive(urlCountry);
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && stored !== active) {
        setActive(stored);
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.set("country", stored);
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch {
      // ignore
    }
  }, []);

  function handleSelect(value: string) {
    setActive(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("country", value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {COUNTRIES.map((c) => {
        const isActive = active === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => handleSelect(c.value)}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.06em] transition-colors",
              isActive
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)] hover:text-[var(--color-fg)]",
            )}
          >
            {c.label}
          </button>
        );
      })}
      <span
        className="ml-1 inline-flex items-center text-[var(--color-muted)]"
        title="Trending news clustered from global newsrooms via GDELT, refreshed every 30 minutes."
      >
        <HelpCircle className="h-3.5 w-3.5" aria-label="About country filtering" />
      </span>
    </div>
  );
}
