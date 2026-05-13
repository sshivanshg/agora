"use client";
import { Button, Select } from "@agora/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const PERSONA_OPTIONS = [
  { slug: "classical-liberal", label: "The Classical Liberal" },
  { slug: "progressive-reformer", label: "The Progressive Reformer" },
  { slug: "conservative-traditionalist", label: "The Conservative Traditionalist" },
  { slug: "technocrat", label: "The Technocrat" },
];

export default function WorkshopPage() {
  const router = useRouter();
  const [resolution, setResolution] = useState("");
  const [framingNotes, setFramingNotes] = useState("");
  const [format, setFormat] = useState("oxford_lite");
  const [country, setCountry] = useState("global");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([
    "classical-liberal",
    "progressive-reformer",
    "conservative-traditionalist",
    "technocrat",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePersona(slug: string) {
    setSelectedPersonas((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (selectedPersonas.length < 2) {
      setError("Pick at least 2 personas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/debates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution,
          framingNotes: framingNotes || undefined,
          personaSlugs: selectedPersonas,
          format,
          modelId: { provider: "anthropic", model: "claude-sonnet-4-5" },
          country,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Request failed (${res.status})`);
        setLoading(false);
        return;
      }
      const { debateId } = await res.json();
      router.push(`/debates/${debateId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[640px] px-6 py-12">
      <h1 className="mb-2 text-xl font-semibold text-[var(--color-fg)]">Workshop</h1>
      <p className="mb-10 text-sm text-[var(--color-muted)]">Configure and launch a new debate.</p>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label
            htmlFor="resolution"
            className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]"
          >
            Resolution
          </label>
          <textarea
            id="resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="e.g. Liberal democracies should adopt sortition for some legislative seats."
            rows={3}
            required
            minLength={10}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors resize-none"
          />
        </div>

        <div>
          <p className="block mb-3 font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Personas{" "}
            <span className="normal-case text-[var(--color-muted)]">
              ({selectedPersonas.length})
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PERSONA_OPTIONS.map((p) => {
              const active = selectedPersonas.includes(p.slug);
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => togglePersona(p.slug)}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-fg)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-muted)] hover:border-[var(--color-muted)]"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="format"
              className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]"
            >
              Format
            </label>
            <Select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              options={[
                { value: "oxford_lite", label: "Oxford Lite" },
                { value: "socratic", label: "Socratic" },
                { value: "lincoln_douglas", label: "Lincoln-Douglas" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="country"
              className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]"
            >
              Country
            </label>
            <Select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={[
                { value: "global", label: "Global" },
                { value: "in", label: "India" },
                { value: "us", label: "United States" },
                { value: "uk", label: "United Kingdom" },
                { value: "eu", label: "European Union" },
                { value: "br", label: "Brazil" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="framing"
            className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]"
          >
            Framing notes <span className="normal-case">(optional)</span>
          </label>
          <textarea
            id="framing"
            value={framingNotes}
            onChange={(e) => setFramingNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Additional context or constraints for the debate..."
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none transition-colors resize-none"
          />
        </div>

        {error && (
          <div className="rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5 p-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            loading={loading}
            disabled={!resolution.trim() || selectedPersonas.length < 2}
          >
            Launch debate →
          </Button>
        </div>
      </form>
    </div>
  );
}
