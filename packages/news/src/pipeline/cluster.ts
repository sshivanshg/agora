import {
  articles,
  clusterArticles,
  clusters,
  cosineDistance,
  db,
  eq,
  isNotNull,
  sql,
} from "@agora/db";

const SIMILARITY_THRESHOLD = 0.78;
const BATCH_LIMIT = 100;

export interface ClusterStageResult {
  processed: number;
  newClusters: number;
  appended: number;
}

interface PendingArticle {
  id: string;
  countryBucket: string;
  title: string;
  embedding: number[];
}

export async function clusterPendingArticles(): Promise<ClusterStageResult> {
  // Articles that have an embedding but are not yet in any cluster.
  const rows = await db
    .select({
      id: articles.id,
      countryBucket: articles.countryBucket,
      title: articles.title,
      embedding: articles.embedding,
      clusterId: clusterArticles.clusterId,
    })
    .from(articles)
    .leftJoin(clusterArticles, eq(clusterArticles.articleId, articles.id))
    .where(isNotNull(articles.embedding))
    .limit(BATCH_LIMIT * 2);

  const pending: PendingArticle[] = rows
    .filter((r) => r.clusterId === null && r.embedding !== null)
    .slice(0, BATCH_LIMIT)
    .map((r) => ({
      id: r.id,
      countryBucket: r.countryBucket,
      title: r.title,
      embedding: r.embedding as number[],
    }));

  let newClusters = 0;
  let appended = 0;

  for (const a of pending) {
    // Look for the closest existing cluster in the same bucket.
    const distanceExpr = cosineDistance(clusters.centroidEmbedding, a.embedding);
    const candidate = await db
      .select({
        id: clusters.id,
        articleCount: clusters.articleCount,
        centroid: clusters.centroidEmbedding,
        distance: sql<number>`${distanceExpr}`,
      })
      .from(clusters)
      .where(eq(clusters.countryBucket, a.countryBucket))
      .orderBy(distanceExpr)
      .limit(1);

    const best = candidate[0];
    const similarity = best ? 1 - Number(best.distance) : -1;

    if (best?.centroid && similarity >= SIMILARITY_THRESHOLD) {
      // Append: weighted-mean centroid update.
      const count = best.articleCount;
      const newCount = count + 1;
      const newCentroid = best.centroid.map(
        (v, i) => (v * count + (a.embedding[i] ?? 0)) / newCount,
      );
      await db.insert(clusterArticles).values({
        clusterId: best.id,
        articleId: a.id,
        similarity,
      });
      await db
        .update(clusters)
        .set({
          centroidEmbedding: newCentroid,
          articleCount: newCount,
          lastUpdatedAt: new Date(),
        })
        .where(eq(clusters.id, best.id));
      appended++;
    } else {
      // Seed new cluster.
      const [created] = await db
        .insert(clusters)
        .values({
          countryBucket: a.countryBucket,
          centroidEmbedding: a.embedding,
          representativeTitle: a.title,
          articleCount: 1,
        })
        .returning({ id: clusters.id });
      if (created) {
        await db.insert(clusterArticles).values({
          clusterId: created.id,
          articleId: a.id,
          similarity: 1,
        });
        newClusters++;
      }
    }
  }

  await recomputeTrendingScores();

  return { processed: pending.length, newClusters, appended };
}

/**
 * trending_score = articleCount / log2(hours_since_first + 2)
 */
async function recomputeTrendingScores(): Promise<void> {
  await db.execute(sql`
    UPDATE clusters
    SET trending_score =
      article_count::real
      / GREATEST(
          1.0,
          LOG(2, GREATEST(EXTRACT(EPOCH FROM (NOW() - first_seen_at)) / 3600.0, 0) + 2)
        )
  `);
}
