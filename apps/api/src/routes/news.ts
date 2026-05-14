import {
  and,
  articles,
  clusterArticles,
  clusters,
  db,
  debatePersonas,
  debates,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  personas as personasTable,
  sql,
} from "@agora/db";
import { readCostCeilings, runDebate } from "@agora/orchestrator";
import { Hono } from "hono";
import type { OwnerEnv } from "../middleware/owner.js";

export const newsRouter = new Hono<OwnerEnv>();

const DEFAULT_DEBATE_PERSONAS = [
  "classical-liberal",
  "progressive-reformer",
  "conservative-traditionalist",
  "technocrat",
];

const VALID_BUCKETS = new Set(["global", "in", "us", "uk", "eu", "br", "other"]);

newsRouter.get("/trending", async (c) => {
  const country = c.req.query("country") ?? "global";
  if (!VALID_BUCKETS.has(country)) {
    return c.json({ error: "invalid_country", country }, 400);
  }
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? "20"), 1), 100);

  const rows = await db
    .select()
    .from(clusters)
    .where(
      and(
        eq(clusters.countryBucket, country),
        eq(clusters.isDebatable, true),
        isNotNull(clusters.resolution),
      ),
    )
    .orderBy(desc(clusters.trendingScore), desc(clusters.lastUpdatedAt))
    .limit(limit);

  // For each cluster, get top sources (by frequency) and hasDebate.
  const out = await Promise.all(
    rows.map(async (cluster) => {
      const sourceRows = await db
        .select({
          sourceName: articles.sourceName,
          c: sql<number>`count(*)::int`,
        })
        .from(clusterArticles)
        .innerJoin(articles, eq(articles.id, clusterArticles.articleId))
        .where(eq(clusterArticles.clusterId, cluster.id))
        .groupBy(articles.sourceName)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(4);

      return {
        id: cluster.id,
        countryBucket: cluster.countryBucket,
        representativeTitle: cluster.representativeTitle,
        articleCount: cluster.articleCount,
        firstSeenAt: cluster.firstSeenAt,
        lastUpdatedAt: cluster.lastUpdatedAt,
        trendingScore: cluster.trendingScore,
        resolution: cluster.resolution,
        framingNotes: cluster.framingNotes,
        topSources: sourceRows.map((s) => s.sourceName),
        hasDebate: cluster.debateId !== null,
        debateId: cluster.debateId,
      };
    }),
  );

  return c.json({ clusters: out });
});

newsRouter.get("/cluster/:id", async (c) => {
  const id = c.req.param("id");
  const [cluster] = await db.select().from(clusters).where(eq(clusters.id, id)).limit(1);
  if (!cluster) return c.json({ error: "not_found" }, 404);

  const memberArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      url: articles.url,
      sourceName: articles.sourceName,
      sourceDomain: articles.sourceDomain,
      publishedAt: articles.publishedAt,
      similarity: clusterArticles.similarity,
    })
    .from(clusterArticles)
    .innerJoin(articles, eq(articles.id, clusterArticles.articleId))
    .where(eq(clusterArticles.clusterId, cluster.id))
    .orderBy(desc(clusterArticles.similarity));

  return c.json({ cluster, articles: memberArticles });
});

export async function createDebateFromClusterId(clusterId: string): Promise<
  | { ok: true; debateId: string }
  | {
      ok: false;
      status: number;
      body: Record<string, unknown>;
    }
> {
  const [cluster] = await db.select().from(clusters).where(eq(clusters.id, clusterId)).limit(1);
  if (!cluster) {
    return { ok: false, status: 404, body: { error: "cluster_not_found" } };
  }
  if (!cluster.isDebatable || !cluster.resolution) {
    return {
      ok: false,
      status: 400,
      body: { error: "cluster_not_debatable", reason: cluster.rejectionReason },
    };
  }
  if (cluster.debateId) {
    return { ok: true, debateId: cluster.debateId };
  }

  // Per-day ceiling check
  const { perDayUsd } = await readCostCeilings();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todaySpend = await db
    .select({ total: sql<number>`coalesce(sum(${debates.totalCost}), 0)` })
    .from(debates)
    .where(gte(debates.createdAt, todayStart));
  const spentToday = Number(todaySpend[0]?.total ?? 0);
  if (spentToday >= perDayUsd) {
    return {
      ok: false,
      status: 429,
      body: { error: "daily_cost_ceiling_exceeded", spent: spentToday, ceiling: perDayUsd },
    };
  }

  // Find default personas
  const personas = await db
    .select()
    .from(personasTable)
    .where(
      and(inArray(personasTable.slug, DEFAULT_DEBATE_PERSONAS), eq(personasTable.isActive, true)),
    );
  if (personas.length < 2) {
    return {
      ok: false,
      status: 500,
      body: { error: "insufficient_active_personas", count: personas.length },
    };
  }

  const [created] = await db
    .insert(debates)
    .values({
      resolution: cluster.resolution,
      framingNotes: cluster.framingNotes ?? "",
      format: "oxford_lite",
      country: cluster.countryBucket,
      status: "pending",
    })
    .returning();
  if (!created) {
    return { ok: false, status: 500, body: { error: "create_failed" } };
  }

  // Preserve order by DEFAULT_DEBATE_PERSONAS
  const slugToPersona = new Map(personas.map((p) => [p.slug, p]));
  const ordered = DEFAULT_DEBATE_PERSONAS.map((slug) => slugToPersona.get(slug)).filter(
    (p): p is NonNullable<typeof p> => p !== undefined,
  );
  await db.insert(debatePersonas).values(
    ordered.map((p, i) => ({
      debateId: created.id,
      personaId: p.id,
      order: i,
    })),
  );

  await db.update(clusters).set({ debateId: created.id }).where(eq(clusters.id, cluster.id));

  // Fire-and-forget orchestration
  (async () => {
    try {
      for await (const _ of runDebate({ debateId: created.id })) {
        // events persisted by orchestrator
      }
    } catch (err) {
      console.error(`[debate ${created.id}] from-cluster run crashed:`, err);
    }
  })();

  return { ok: true, debateId: created.id };
}

newsRouter.post("/debates/from-cluster/:clusterId", async (c) => {
  const clusterId = c.req.param("clusterId");
  const result = await createDebateFromClusterId(clusterId);
  if (!result.ok) {
    return c.json(result.body, result.status as 400 | 404 | 429 | 500);
  }
  return c.json({ debateId: result.debateId }, 201);
});

newsRouter.get("/sources", (c) => {
  const active = (process.env.NEWS_PROVIDER ?? "gdelt").toLowerCase();
  const enabledBuckets = (process.env.NEWS_BUCKETS_ENABLED ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return c.json({
    active,
    available: ["gdelt", "rss", "gnews", "mediastack"],
    bucketsEnabled:
      enabledBuckets.length > 0
        ? enabledBuckets
        : ["global", "in", "us", "uk", "eu", "br", "other"],
  });
});
