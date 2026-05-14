import { articles, db } from "@agora/db";
import { createNewsProvider } from "../providers/factory.js";
import type { CountryBucket } from "../types.js";

export interface FetchStageResult {
  inserted: number;
  skipped: number;
  fetched: number;
}

export async function runFetchForBucket(bucket: CountryBucket): Promise<FetchStageResult> {
  const provider = createNewsProvider();
  const raw = await provider.fetchTrending(bucket, { timespan: "6h", maxResults: 100 });
  let inserted = 0;
  let skipped = 0;
  for (const a of raw) {
    const res = await db
      .insert(articles)
      .values({
        id: a.id,
        providerName: provider.name,
        country: a.country,
        countryBucket: a.countryBucket,
        sourceName: a.sourceName,
        sourceDomain: a.sourceDomain,
        title: a.title,
        description: a.description ?? null,
        url: a.url,
        publishedAt: a.publishedAt,
        language: a.language,
        themes: a.themes ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: articles.id });
    if (res.length) inserted++;
    else skipped++;
  }
  return { inserted, skipped, fetched: raw.length };
}
