"use client";

import { Select } from "@agora/ui";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const COUNTRY_OPTIONS = [
  { value: "", label: "Any country" },
  { value: "global", label: "Global" },
  { value: "in", label: "India" },
  { value: "us", label: "US" },
  { value: "uk", label: "UK" },
  { value: "eu", label: "EU" },
  { value: "br", label: "Brazil" },
];

const FORMAT_OPTIONS = [
  { value: "", label: "Any format" },
  { value: "oxford_lite", label: "Oxford Lite" },
  { value: "socratic", label: "Socratic" },
  { value: "lincoln_douglas", label: "Lincoln-Douglas" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "most_expensive", label: "Most expensive" },
  { value: "most_discussed", label: "Most discussed" },
];

export function ArchiveFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams?.get("q") ?? "");

  // Keep local search state in sync if URL changes externally
  useEffect(() => {
    setQ(searchParams?.get("q") ?? "");
  }, [searchParams]);

  const country = searchParams?.get("country") ?? "";
  const format = searchParams?.get("format") ?? "";
  const status = searchParams?.get("status") ?? "";
  const sort = searchParams?.get("sort") ?? "newest";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value) params.set(key, value);
    else params.delete(key);
    // Reset pagination when filters change
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    update("q", q);
  }

  function clearAll() {
    setQ("");
    router.replace(pathname);
  }

  const hasFilters = Boolean(
    searchParams?.get("q") || country || format || status || (sort && sort !== "newest"),
  );

  return (
    <div className="mb-8 space-y-3">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
        <input
          type="search"
          placeholder="Search resolutions…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => {
            if ((searchParams?.get("q") ?? "") !== q) update("q", q);
          }}
          className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elev)] pl-9 pr-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
        />
      </form>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          aria-label="Country"
          options={COUNTRY_OPTIONS}
          value={country}
          onChange={(e) => update("country", e.target.value)}
        />
        <Select
          aria-label="Format"
          options={FORMAT_OPTIONS}
          value={format}
          onChange={(e) => update("format", e.target.value)}
        />
        <Select
          aria-label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => update("status", e.target.value)}
        />
        <Select
          aria-label="Sort"
          options={SORT_OPTIONS}
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 font-mono text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
