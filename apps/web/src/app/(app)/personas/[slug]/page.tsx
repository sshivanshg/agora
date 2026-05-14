import { and, db, debatePersonas, debates, eq, gte, personas, sql } from "@agora/db";
import { PersonaMonogram, Separator } from "@agora/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [persona] = await db.select().from(personas).where(eq(personas.slug, slug)).limit(1);
  return { title: persona?.name ?? "Persona" };
}

interface ParsedFrontmatter {
  worldview_tag?: string;
  epistemic_style?: string;
  rhetorical_signature?: string;
  core_values?: string[];
  characteristic_concerns?: string[];
  blind_spots?: string[];
  model_preference?: string;
  temperature?: string;
  name?: string;
  id?: string;
}

function parseSpec(specContent: string): {
  frontmatter: ParsedFrontmatter;
  body: string;
} {
  const match = specContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: specContent };

  const fm = match[1] ?? "";
  const body = match[2] ?? "";
  const lines = fm.split("\n");
  const result: ParsedFrontmatter = {};
  let currentKey: keyof ParsedFrontmatter | null = null;
  const listKeys = new Set<keyof ParsedFrontmatter>([
    "core_values",
    "characteristic_concerns",
    "blind_spots",
  ]);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (line.startsWith("  - ") || line.startsWith("- ")) {
      const item = line.replace(/^\s*-\s*/, "").trim();
      if (currentKey && listKeys.has(currentKey)) {
        const list = (result[currentKey] as string[] | undefined) ?? [];
        list.push(item);
        (result[currentKey] as string[]) = list;
      }
      continue;
    }
    const m = line.match(/^([a-z_][a-z0-9_]*):\s*(.*)$/i);
    if (!m) continue;
    const key = m[1] as keyof ParsedFrontmatter;
    const value = (m[2] ?? "").trim();
    currentKey = key;
    if (listKeys.has(key)) {
      if (value) {
        (result[key] as string[]) = [value];
      } else {
        (result[key] as string[]) = [];
      }
    } else {
      (result[key] as string) = value;
    }
  }

  return { frontmatter: result, body: body.trim() };
}

// Lightweight markdown renderer for persona spec body — handles h1/h2/h3, paragraphs,
// unordered lists, and bold. No external dep.
function renderBody(md: string) {
  const blocks = md.split(/\n{2,}/);
  return blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    const blockKey = trimmed.slice(0, 80);

    if (trimmed.startsWith("# ")) {
      return (
        <h1
          key={blockKey}
          className="mb-6 mt-8 font-serif text-3xl text-[var(--color-fg)] first:mt-0"
        >
          {trimmed.slice(2)}
        </h1>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={blockKey} className="mb-3 mt-8 font-serif text-2xl text-[var(--color-fg)]">
          {trimmed.slice(3)}
        </h2>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={blockKey} className="mb-2 mt-6 font-serif text-xl text-[var(--color-fg)]">
          {trimmed.slice(4)}
        </h3>
      );
    }
    if (trimmed.split("\n").every((l) => /^\s*-\s+/.test(l))) {
      return (
        <ul
          key={blockKey}
          className="mb-4 list-disc space-y-1 pl-6 text-sm text-[var(--color-muted)]"
        >
          {trimmed.split("\n").map((l) => {
            const item = l.replace(/^\s*-\s+/, "");
            return <li key={item}>{renderInline(item)}</li>;
          })}
        </ul>
      );
    }
    return (
      <p key={blockKey} className="mb-4 text-[15px] leading-[1.8] text-[var(--color-muted)]">
        {renderInline(trimmed)}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode[] {
  // Handle **bold** and *italic*
  const out: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const bold = remaining.match(/\*\*([^*]+)\*\*/);
    const italic = remaining.match(/\*([^*]+)\*/);
    const next = (() => {
      if (bold && italic && bold.index !== undefined && italic.index !== undefined) {
        return bold.index <= italic.index ? bold : italic;
      }
      return bold ?? italic;
    })();
    if (!next || next.index === undefined) {
      out.push(remaining);
      break;
    }
    if (next.index > 0) out.push(remaining.slice(0, next.index));
    if (next === bold) {
      out.push(
        <strong key={key++} className="text-[var(--color-fg)]">
          {next[1]}
        </strong>,
      );
    } else {
      out.push(
        <em key={key++} className="italic">
          {next[1]}
        </em>,
      );
    }
    remaining = remaining.slice(next.index + next[0].length);
  }
  return out;
}

function formatCurrency(n: number) {
  return `$${(n ?? 0).toFixed(2)}`;
}

export default async function PersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [persona] = await db.select().from(personas).where(eq(personas.slug, slug)).limit(1);
  if (!persona) notFound();

  const { frontmatter, body } = parseSpec(persona.specContent);

  // Recent debates featuring this persona (last 30 days)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentDebates = await db
    .select({
      id: debates.id,
      resolution: debates.resolution,
      format: debates.format,
      country: debates.country,
      status: debates.status,
      totalCost: debates.totalCost,
      createdAt: debates.createdAt,
    })
    .from(debates)
    .innerJoin(debatePersonas, eq(debatePersonas.debateId, debates.id))
    .where(and(eq(debatePersonas.personaId, persona.id), gte(debates.createdAt, cutoff)))
    .orderBy(sql`${debates.createdAt} desc`)
    .limit(6);

  const epistemic = frontmatter.epistemic_style ?? "";
  const rhetorical = frontmatter.rhetorical_signature ?? "";
  const coreValues = frontmatter.core_values ?? [];
  const blindSpots = frontmatter.blind_spots ?? [];
  const subline =
    epistemic && rhetorical
      ? `${epistemic}. ${rhetorical}.`
      : epistemic || rhetorical || persona.worldviewTag;

  return (
    <div className="mx-auto max-w-[960px] px-6 py-10">
      {/* Breadcrumb */}
      <Link
        href="/personas"
        className="mb-10 inline-flex items-center gap-1 font-mono text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Personas
      </Link>

      {/* Hero */}
      <div className="mb-12 flex flex-col items-center text-center">
        <PersonaMonogram name={persona.name} size="lg" className="!h-24 !w-24 !text-2xl" />
        <h1 className="mt-6 font-serif text-5xl leading-tight text-[var(--color-fg)]">
          {persona.name}
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
          {persona.worldviewTag}
        </p>
        <p className="mt-6 max-w-2xl font-serif italic text-base leading-relaxed text-[var(--color-muted)]">
          {subline}
        </p>
      </div>

      <Separator className="mb-12" />

      {/* Two-column body */}
      <div className="grid gap-12 md:grid-cols-3">
        <aside className="space-y-8 md:sticky md:top-8 md:self-start">
          {coreValues.length > 0 && (
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                CORE VALUES
              </p>
              <ul className="space-y-1 text-sm text-[var(--color-fg)]">
                {coreValues.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
          )}
          {epistemic && (
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                EPISTEMIC STYLE
              </p>
              <p className="text-sm text-[var(--color-fg)]">{epistemic}</p>
            </div>
          )}
          {rhetorical && (
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                RHETORICAL SIGNATURE
              </p>
              <p className="text-sm text-[var(--color-fg)]">{rhetorical}</p>
            </div>
          )}
          {blindSpots.length > 0 && (
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                BLIND SPOTS
              </p>
              <ul className="space-y-1 text-sm text-[var(--color-fg)]">
                {blindSpots.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <div className="md:col-span-2">{renderBody(body)}</div>
      </div>

      {/* Recent debates */}
      {recentDebates.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
            RECENT DEBATES FEATURING {persona.name.toUpperCase()}
          </h2>
          <div className="-mx-6 overflow-x-auto px-6 pb-2">
            <div className="flex gap-3">
              {recentDebates.map((d) => (
                <Link
                  key={d.id}
                  href={`/debates/${d.id}`}
                  className="group flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 transition-colors hover:border-[var(--color-muted)]"
                >
                  <p
                    className="font-serif text-base leading-snug text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors"
                    style={{ textWrap: "balance" } as React.CSSProperties}
                  >
                    {d.resolution}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-muted)]">
                    <span>{d.format.replace(/_/g, " ")}</span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span>
                      {new Date(d.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span>{formatCurrency(d.totalCost ?? 0)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GitHub link */}
      <div className="mt-16 border-t border-[var(--color-border)] pt-8 text-center">
        <a
          href={`https://github.com/your-org/agora/blob/main/packages/personas/specs/${persona.slug}.md`}
          target="_blank"
          rel="noreferrer noopener"
          className="font-mono text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
        >
          View this spec on GitHub →
        </a>
      </div>
    </div>
  );
}
