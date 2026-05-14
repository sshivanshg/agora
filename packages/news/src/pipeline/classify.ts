import { and, articles, clusterArticles, clusters, db, desc, eq, gte, isNull } from "@agora/db";
import { classifyCluster } from "../agents/classifier.js";

const BATCH_LIMIT = 20;
const MIN_ARTICLES_FOR_CLASSIFICATION = 2;

export interface ClassifyStageResult {
  classified: number;
  debatable: number;
  rejected: number;
  errors: number;
}

export async function classifyPendingClusters(): Promise<ClassifyStageResult> {
  const pending = await db
    .select()
    .from(clusters)
    .where(
      and(
        isNull(clusters.isDebatable),
        gte(clusters.articleCount, MIN_ARTICLES_FOR_CLASSIFICATION),
      ),
    )
    .orderBy(desc(clusters.trendingScore))
    .limit(BATCH_LIMIT);

  let debatable = 0;
  let rejected = 0;
  let errors = 0;

  for (const cluster of pending) {
    try {
      const memberArticles = await db
        .select({
          title: articles.title,
          sourceName: articles.sourceName,
          themes: articles.themes,
        })
        .from(clusterArticles)
        .innerJoin(articles, eq(articles.id, clusterArticles.articleId))
        .where(eq(clusterArticles.clusterId, cluster.id))
        .orderBy(desc(clusterArticles.similarity))
        .limit(5);

      const titles = memberArticles.map((a) => a.title);
      const sourceNames = Array.from(new Set(memberArticles.map((a) => a.sourceName))).filter(
        Boolean,
      );
      const themeSet = new Set<string>();
      for (const a of memberArticles) {
        for (const t of a.themes ?? []) themeSet.add(t);
      }

      const verdict = await classifyCluster({
        representativeTitle: cluster.representativeTitle,
        articleTitles: titles,
        themes: Array.from(themeSet),
        sourceNames,
      });

      await db
        .update(clusters)
        .set({
          isDebatable: verdict.is_debatable,
          rejectionReason: verdict.rejection_reason ?? null,
          resolution: verdict.proposed_resolution ?? null,
          framingNotes: verdict.proposed_framing ?? null,
          framedAt: new Date(),
        })
        .where(eq(clusters.id, cluster.id));

      if (verdict.is_debatable) debatable++;
      else rejected++;
    } catch (err) {
      errors++;
      console.error(`[news/classify] cluster ${cluster.id} failed:`, err);
    }
  }

  return { classified: debatable + rejected, debatable, rejected, errors };
}
