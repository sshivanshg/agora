import { classifyPendingClusters } from "../pipeline/classify.js";
import { clusterPendingArticles } from "../pipeline/cluster.js";
import { embedPendingArticles } from "../pipeline/embed.js";
import { runFetchForBucket } from "../pipeline/fetch.js";
import { COUNTRY_BUCKETS, type CountryBucket } from "../types.js";

function parseBuckets(arg: string | undefined): CountryBucket[] {
  if (!arg) return COUNTRY_BUCKETS;
  const requested = arg.split(",").map((s) => s.trim()) as CountryBucket[];
  const allowed = new Set<string>(COUNTRY_BUCKETS);
  return requested.filter((b) => allowed.has(b));
}

async function main(): Promise<void> {
  const buckets = parseBuckets(process.argv[2]);

  console.log(`[pipeline] fetch buckets=${buckets.join(",")}`);
  for (const b of buckets) {
    try {
      const r = await runFetchForBucket(b);
      console.log(
        `[pipeline] fetch ${b}: fetched=${r.fetched} inserted=${r.inserted} skipped=${r.skipped}`,
      );
    } catch (err) {
      console.error(`[pipeline] fetch ${b} failed:`, err);
    }
  }

  console.log("[pipeline] embed");
  const e = await embedPendingArticles();
  if (e.skipped) console.log(`[pipeline] embed skipped: ${e.reason ?? "unknown"}`);
  else console.log(`[pipeline] embed embedded=${e.embedded}`);

  console.log("[pipeline] cluster");
  const c = await clusterPendingArticles();
  console.log(
    `[pipeline] cluster processed=${c.processed} newClusters=${c.newClusters} appended=${c.appended}`,
  );

  console.log("[pipeline] classify");
  const k = await classifyPendingClusters();
  console.log(
    `[pipeline] classify classified=${k.classified} debatable=${k.debatable} rejected=${k.rejected} errors=${k.errors}`,
  );

  process.exit(0);
}

void main();
