import { Separator } from "@agora/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StartDebateButton } from "../../today/start-debate-button";

interface ClusterRecord {
  id: string;
  countryBucket: string;
  representativeTitle: string;
  articleCount: number;
  firstSeenAt: string;
  lastUpdatedAt: string;
  trendingScore: number;
  isDebatable: boolean | null;
  rejectionReason: string | null;
  resolution: string | null;
  framingNotes: string | null;
  framedAt: string | null;
  debateId: string | null;
}

interface ClusterArticleRecord {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  sourceDomain: string;
  publishedAt: string;
  similarity: number;
}

interface ClusterDetailResponse {
  cluster: ClusterRecord;
  articles: ClusterArticleRecord[];
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

async function fetchClusterDetail(clusterId: string): Promise<ClusterDetailResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${apiUrl}/news/cluster/${clusterId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ClusterDetailResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clusterId: string }>;
}) {
  const { clusterId } = await params;
  const data = await fetchClusterDetail(clusterId);
  if (!data) return { title: "Trending story" };
  const title = data.cluster.representativeTitle;
  const short = title.length > 60 ? `${title.slice(0, 57)}…` : title;
  return { title: short };
}

export default async function TrendingClusterPage({
  params,
}: {
  params: Promise<{ clusterId: string }>;
}) {
  const { clusterId } = await params;
  const data = await fetchClusterDetail(clusterId);
  if (!data) notFound();

  const { cluster, articles } = data;
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <div className="mx-auto max-w-[820px] px-6 py-12">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link
          href="/today"
          className="inline-flex items-center font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
        >
          ← Back to Today
        </Link>
      </div>

      {/* Eyebrow */}
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        TRENDING STORY
      </p>

      {/* Headline */}
      <h1
        className="font-serif text-3xl leading-tight text-[var(--color-fg)] md:text-4xl"
        style={{ textWrap: "balance" } as React.CSSProperties}
      >
        {cluster.representativeTitle}
      </h1>

      {/* Framing notes — editorial angle */}
      {cluster.framingNotes && (
        <p className="mt-6 max-w-prose font-serif text-base italic leading-relaxed text-[var(--color-muted)]">
          {cluster.framingNotes}
        </p>
      )}

      <div className="my-10">
        <Separator />
      </div>

      {/* Underlying coverage */}
      <section>
        <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
          UNDERLYING COVERAGE
        </h2>
        {sortedArticles.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No articles in this cluster yet.</p>
        ) : (
          <ul className="space-y-5">
            {sortedArticles.map((article) => (
              <li key={article.id} className="flex flex-col gap-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-muted)]">
                  {article.sourceName}
                  <span className="text-[var(--color-border)]"> · </span>
                  {formatRelativeTime(article.publishedAt)}
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-serif text-base leading-snug text-[var(--color-fg)] underline-offset-4 transition-colors hover:underline"
                >
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bottom action bar */}
      <div className="mt-12 flex justify-end border-t border-[var(--color-border)] pt-6">
        {cluster.debateId ? (
          <Link
            href={`/debates/${cluster.debateId}`}
            className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent px-4 font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-fg)] transition-colors hover:border-[var(--color-muted)] hover:bg-[var(--color-bg-elev)]"
          >
            Watch the debate →
          </Link>
        ) : cluster.isDebatable && cluster.resolution ? (
          <StartDebateButton clusterId={cluster.id} size="md" />
        ) : (
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-muted)]">
            Not yet framed for debate
          </p>
        )}
      </div>
    </div>
  );
}
