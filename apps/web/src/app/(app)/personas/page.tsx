import { db, personas } from "@agora/db";
import Link from "next/link";

export const metadata = { title: "Personas" };

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

export default async function PersonasPage() {
  const allPersonas = await db.select().from(personas);

  return (
    <div className="mx-auto max-w-[960px] px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--color-fg)]">Personas</h1>
        <span className="font-mono text-xs text-[var(--color-muted)]">
          {allPersonas.length} total
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allPersonas.map((persona) => {
          const color = getColor(persona.name);
          const initials = getInitials(persona.name);
          return (
            <Link
              key={persona.id}
              href={`/personas/${persona.slug}`}
              className="group flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 transition-colors hover:border-[var(--color-muted)]"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full font-mono text-sm font-medium"
                style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
              >
                {initials}
              </div>
              <div>
                <p className="font-medium text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors">
                  {persona.name}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  {persona.worldviewTag}
                </p>
              </div>
              {!persona.isActive && (
                <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-muted)]">
                  inactive
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
