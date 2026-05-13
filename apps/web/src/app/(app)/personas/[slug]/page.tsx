import { db, personas } from "@agora/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();
}

const COLORS = [
  "oklch(0.65 0.15 25)",
  "oklch(0.65 0.15 145)",
  "oklch(0.65 0.15 260)",
  "oklch(0.65 0.15 320)",
  "oklch(0.65 0.15 75)",
  "oklch(0.65 0.15 200)",
];
function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default async function PersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [persona] = await db.select().from(personas).where(eq(personas.slug, slug)).limit(1);
  if (!persona) notFound();

  const color = getColor(persona.name);

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      <div className="mb-10 flex items-start gap-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-mono text-base font-medium"
          style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
        >
          {getInitials(persona.name)}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">{persona.name}</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {persona.worldviewTag}
          </p>
          {persona.modelPreference && (
            <p className="mt-2 font-mono text-xs text-[var(--color-muted)]">
              Prefers: {persona.modelPreference}
            </p>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
          Spec
        </p>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-fg)]">
          {persona.specContent}
        </pre>
      </div>
    </div>
  );
}
