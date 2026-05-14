import { and, db, debatePersonas, debates, desc, eq, inArray, or, personas } from "@agora/db";
import { EmptyState, PersonaMonogram } from "@agora/ui";
import { MessageSquare, Newspaper } from "lucide-react";
import Link from "next/link";
import { CountryPills } from "./country-pills";
import { StartDebateButton } from "./start-debate-button";

export const metadata = { title: "Today" };

const DEFAULT_DEBATE_PERSONAS = [
  "classical-liberal",
  "progressive-reformer",
  "conservative-traditionalist",
  "technocrat",
];

interface TrendingClusterResponse {
  id: string;
  countryBucket: string;
  representativeTitle: string;
  articleCount: number;
  firstSeenAt: string;
  lastUpdatedAt: string;
  trendingScore: number;
  resolution: string;
  framingNotes: string | null;
  topSources: string[];
  hasDebate: boolean;
  debateId: string | null;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay <= 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] ?? 0;
}

interface TodayPageProps {
  searchParams: Promise<{ country?: string }>;
}

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const { country = "global" } = await searchParams;
  const today = new Date();

  // --- Latest 3 debates for the selected country ---
  const debateRows = await db
    .select({
      id: debates.id,
      resolution: debates.resolution,
      format: debates.format,
      status: debates.status,
      createdAt: debates.createdAt,
    })
    .from(debates)
    .where(
      and(
        eq(debates.country, country),
        or(eq(debates.status, "running"), eq(debates.status, "completed")),
      ),
    )
    .orderBy(desc(debates.createdAt))
    .limit(3);

  const debateIds = debateRows.map((r) => r.id);
  const personaRows = debateIds.length
    ? await db
        .select({
          debateId: debatePersonas.debateId,
          name: personas.name,
        })
        .from(debatePersonas)
        .innerJoin(personas, eq(personas.id, debatePersonas.personaId))
        .where(inArray(debatePersonas.debateId, debateIds))
    : [];
  const personasByDebate = new Map<string, string[]>();
  for (const r of personaRows) {
    const list = personasByDebate.get(r.debateId) ?? [];
    list.push(r.name);
    personasByDebate.set(r.debateId, list);
  }

  // --- Trending clusters via API ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  let trendingClusters: TrendingClusterResponse[] = [];
  try {
    const res = await fetch(`${apiUrl}/news/trending?country=${country}&limit=8`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { clusters?: TrendingClusterResponse[] };
      trendingClusters = Array.isArray(data?.clusters) ? data.clusters : [];
    }
  } catch {
    trendingClusters = [];
  }

  const trendingScores = trendingClusters.map((c) => c.trendingScore);
  const trendingThreshold = percentile(trendingScores, 75);

  return (
    <div className="mx-auto max-w-[1024px] px-6 py-12">
      {/* Header */}
      <header className="mb-10">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
          TODAY · {formatDate(today)}
        </p>
        <h1 className="font-serif text-4xl leading-tight text-[var(--color-fg)] md:text-5xl">
          Trending now.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
          Stories clustered from global newsrooms via GDELT, refreshed every 30 minutes. Pick a
          region and start arguing about what matters.
        </p>
      </header>

      {/* Country filter */}
      <div className="mb-12">
        <CountryPills initialCountry={country} />
      </div>

      {/* Debates section */}
      <section className="mb-16">
        <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
          DEBATES
        </h2>
        {debateRows.length === 0 ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            <EmptyState
              icon={<MessageSquare className="h-10 w-10" />}
              title="No debates yet for this region"
              description="Start one from a trending story below."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {debateRows.map((debate) => {
              const personaList = personasByDebate.get(debate.id) ?? [];
              const isLive = debate.status === "running";
              const isCompleted = debate.status === "completed";
              return (
                <Link
                  key={debate.id}
                  href={`/debates/${debate.id}`}
                  className="group flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 transition-colors hover:border-[var(--color-muted)]"
                >
                  <div className="flex items-center gap-2">
                    {isLive && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-accent)]">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"
                        />
                        LIVE
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-success)]">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"
                        />
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <p
                    className="font-serif text-xl leading-snug text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-accent)]"
                    style={{ textWrap: "balance" } as React.CSSProperties}
                  >
                    {debate.resolution}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-muted)]">
                    <span>{debate.format.replace(/_/g, " ")}</span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span>
                      {personaList.length} persona{personaList.length === 1 ? "" : "s"}
                    </span>
                    <span className="text-[var(--color-border)]">·</span>
                    <span>{formatRelativeTime(debate.createdAt)}</span>
                  </div>
                  {personaList.length > 0 && (
                    <div className="flex -space-x-2">
                      {personaList.slice(0, 6).map((name) => (
                        <PersonaMonogram key={name} name={name} size="sm" />
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Trending stories section */}
      <section>
        <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
          TRENDING STORIES
        </h2>
        {trendingClusters.length === 0 ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            <EmptyState
              icon={<Newspaper className="h-10 w-10" />}
              title="The pipeline is still gathering"
              description="Check back in a few minutes."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {trendingClusters.map((cluster) => {
              const top = cluster.topSources.slice(0, 4);
              const remaining = Math.max(0, cluster.articleCount - top.length);
              const sourceLabel =
                top.length === 0
                  ? `${cluster.articleCount} source${cluster.articleCount === 1 ? "" : "s"}`
                  : remaining > 0
                    ? `${top.join(" · ")} · ${remaining} other source${remaining === 1 ? "" : "s"}`
                    : top.join(" · ");
              const isTrending =
                trendingClusters.length >= 4 && cluster.trendingScore >= trendingThreshold;
              return (
                <div
                  key={cluster.id}
                  className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 transition-colors hover:border-[var(--color-muted)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-muted)]">
                      {sourceLabel}
                    </p>
                    {isTrending && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-accent)]">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"
                        />
                        TRENDING
                      </span>
                    )}
                  </div>
                  <p
                    className="line-clamp-2 font-serif text-xl leading-snug text-[var(--color-fg)]"
                    style={{ textWrap: "balance" } as React.CSSProperties}
                  >
                    {cluster.resolution}
                  </p>
                  {cluster.framingNotes && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
                      {cluster.framingNotes}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                    <div className="flex -space-x-2">
                      {DEFAULT_DEBATE_PERSONAS.map((slug) => (
                        <PersonaMonogram key={slug} name={slug.replace(/-/g, " ")} size="sm" />
                      ))}
                    </div>
                    {cluster.hasDebate && cluster.debateId ? (
                      <Link
                        href={`/debates/${cluster.debateId}`}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent px-3 font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-fg)] transition-colors hover:border-[var(--color-muted)] hover:bg-[var(--color-bg-elev)]"
                      >
                        Watch debate →
                      </Link>
                    ) : (
                      <StartDebateButton clusterId={cluster.id} size="sm" />
                    )}
                  </div>
                  <Link
                    href={`/trending/${cluster.id}`}
                    className="self-start font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-fg)] hover:underline"
                  >
                    View underlying news →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
