import {
  and,
  db,
  debatePersonas,
  debateTurns,
  debates,
  eq,
  inArray,
  personas,
  sql,
} from "@agora/db";
import { EmptyState, PersonaMonogram } from "@agora/ui";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { ArchiveFilters } from "./archive-filters";

export const metadata = { title: "Archive" };

const PAGE_SIZE = 20;

interface ArchivePageProps {
  searchParams: Promise<{
    q?: string;
    country?: string;
    format?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}

function formatCurrency(n: number) {
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function formatHours(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return "0";
  if (hours < 1) return `${(hours * 60).toFixed(0)}m`;
  return `${hours.toFixed(1)}`;
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const country = sp.country ?? "";
  const format = sp.format ?? "";
  const status = sp.status ?? "";
  const sort = sp.sort ?? "newest";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  // Aggregate counts/cost/hours (over the full table, not filtered)
  const [aggregate] = await db
    .select({
      count: sql<number>`count(*)::int`,
      totalCost: sql<number>`coalesce(sum(${debates.totalCost}), 0)::float`,
      totalHours: sql<number>`coalesce(sum(extract(epoch from (${debates.completedAt} - ${debates.createdAt})) / 3600.0) filter (where ${debates.status} = 'completed' and ${debates.completedAt} is not null), 0)::float`,
    })
    .from(debates);

  const totalCount = aggregate?.count ?? 0;
  const totalCost = aggregate?.totalCost ?? 0;
  const totalHours = aggregate?.totalHours ?? 0;

  // Build filter conditions
  const conditions = [];
  if (q) conditions.push(sql`${debates.resolution} ilike ${`%${q}%`}`);
  if (country) conditions.push(eq(debates.country, country));
  if (format) conditions.push(eq(debates.format, format));
  if (
    status === "pending" ||
    status === "running" ||
    status === "completed" ||
    status === "failed"
  ) {
    conditions.push(eq(debates.status, status));
  }

  const whereExpr = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort
  const orderBy = (() => {
    switch (sort) {
      case "oldest":
        return sql`${debates.createdAt} asc`;
      case "most_expensive":
        return sql`${debates.totalCost} desc nulls last`;
      case "most_discussed":
        // Use a subquery for turn count when sorting; we'll compute it inline
        return sql`(select count(*) from ${debateTurns} where ${debateTurns.debateId} = ${debates.id}) desc`;
      default:
        return sql`${debates.createdAt} desc`;
    }
  })();

  // Filtered count (for pagination + empty state)
  const [filteredAgg] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(debates)
    .where(whereExpr);
  const filteredCount = filteredAgg?.count ?? 0;

  const limit = page * PAGE_SIZE;
  const rows = await db
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
    .where(whereExpr)
    .orderBy(orderBy)
    .limit(limit);

  // Pull personas per debate (one extra query, then group in JS)
  const debateIds = rows.map((r) => r.id);
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

  const hasMore = filteredCount > limit;
  const nextPage = page + 1;
  const nextPageParams = (() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (country) p.set("country", country);
    if (format) p.set("format", format);
    if (status) p.set("status", status);
    if (sort && sort !== "newest") p.set("sort", sort);
    p.set("page", String(nextPage));
    return p.toString();
  })();

  return (
    <div className="mx-auto max-w-[920px] px-6 py-12">
      {/* Header */}
      <header className="mb-10">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
          ARCHIVE
        </p>
        <h1 className="font-serif text-4xl leading-tight text-[var(--color-fg)] md:text-5xl">
          Every debate we have held.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
          {totalCount} debate{totalCount === 1 ? "" : "s"} · {formatHours(totalHours)} hour
          {totalHours >= 2 ? "s" : ""} of argument · {formatCurrency(totalCost)}
        </p>
      </header>

      <ArchiveFilters />

      {rows.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-10 w-10" />}
          title="No debates match these filters"
          description="Try clearing filters or starting a new debate from the Workshop."
          action={
            <Link
              href="/debates"
              className="rounded-md border border-[var(--color-border)] px-4 py-2 font-mono text-xs lowercase tracking-[0.04em] text-[var(--color-muted)] transition-colors hover:border-[var(--color-muted)] hover:text-[var(--color-fg)]"
            >
              Clear filters
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((debate) => {
            const personaList = personasByDebate.get(debate.id) ?? [];
            const statusClasses =
              debate.status === "running"
                ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] animate-pulse"
                : debate.status === "completed"
                  ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                  : debate.status === "failed"
                    ? "bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
                    : "bg-[var(--color-border)] text-[var(--color-muted)]";
            const statusLabel = debate.status === "running" ? "LIVE" : debate.status.toUpperCase();
            return (
              <Link
                key={debate.id}
                href={`/debates/${debate.id}`}
                className="group flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 transition-colors hover:border-[var(--color-muted)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <p
                    className="font-serif text-xl leading-snug text-[var(--color-fg)] group-hover:text-[var(--color-accent)] transition-colors"
                    style={{ textWrap: "balance" } as React.CSSProperties}
                  >
                    {debate.resolution}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ${statusClasses}`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-muted)]">
                  <span>{debate.format.replace(/_/g, " ")}</span>
                  <span className="text-[var(--color-border)]">·</span>
                  <span>{debate.country}</span>
                  <span className="text-[var(--color-border)]">·</span>
                  <span>
                    {new Date(debate.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-[var(--color-border)]">·</span>
                  <span>{formatCurrency(debate.totalCost ?? 0)}</span>
                  <span className="text-[var(--color-border)]">·</span>
                  <span>by you</span>
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
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Link
                href={`/debates?${nextPageParams}`}
                className="rounded-md border border-[var(--color-border)] px-6 py-2.5 font-mono text-xs lowercase tracking-[0.04em] text-[var(--color-muted)] transition-colors hover:border-[var(--color-muted)] hover:text-[var(--color-fg)]"
              >
                Load more
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
