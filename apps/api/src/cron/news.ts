// TODO: move these crons to a dedicated worker process in a future hosted-mode phase.
// In-process cron is fine for single-instance OSS mode but doesn't survive multiple
// API replicas; the workflow runner should be the eventual home.
import {
  COUNTRY_BUCKETS,
  type CountryBucket,
  classifyPendingClusters,
  clusterPendingArticles,
  embedPendingArticles,
  runFetchForBucket,
} from "@agora/news";
import cron from "node-cron";

const DEFAULT_FETCH_SCHEDULE = "*/30 * * * *";
const DEFAULT_CLASSIFY_SCHEDULE = "0 * * * *";

function isEnabled(): boolean {
  return process.env.NEWS_INGESTION_ENABLED !== "false";
}

function enabledBuckets(): CountryBucket[] {
  const raw = process.env.NEWS_BUCKETS_ENABLED;
  if (!raw) return COUNTRY_BUCKETS;
  const requested = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as CountryBucket[];
  const allowed = new Set<string>(COUNTRY_BUCKETS);
  return requested.filter((b) => allowed.has(b));
}

async function fetchAndEmbedJob(): Promise<void> {
  const buckets = enabledBuckets();
  console.log(`[cron/news] fetch+embed start (buckets=${buckets.join(",")})`);
  for (const b of buckets) {
    try {
      const r = await runFetchForBucket(b);
      console.log(
        `[cron/news] fetch ${b}: fetched=${r.fetched} inserted=${r.inserted} skipped=${r.skipped}`,
      );
    } catch (err) {
      console.error(`[cron/news] fetch ${b} failed:`, err);
    }
  }
  try {
    const r = await embedPendingArticles();
    if (r.skipped) console.log(`[cron/news] embed skipped: ${r.reason ?? "unknown"}`);
    else console.log(`[cron/news] embed embedded=${r.embedded}`);
  } catch (err) {
    console.error("[cron/news] embed failed:", err);
  }
}

async function clusterAndClassifyJob(): Promise<void> {
  console.log("[cron/news] cluster+classify start");
  try {
    const c = await clusterPendingArticles();
    console.log(
      `[cron/news] cluster processed=${c.processed} new=${c.newClusters} appended=${c.appended}`,
    );
  } catch (err) {
    console.error("[cron/news] cluster failed:", err);
  }
  try {
    const k = await classifyPendingClusters();
    console.log(
      `[cron/news] classify classified=${k.classified} debatable=${k.debatable} rejected=${k.rejected} errors=${k.errors}`,
    );
  } catch (err) {
    console.error("[cron/news] classify failed:", err);
  }
}

export function registerNewsCrons(): void {
  if (!isEnabled()) {
    console.log("[cron/news] disabled (NEWS_INGESTION_ENABLED=false)");
    return;
  }
  const fetchSchedule = process.env.NEWS_FETCH_CRON ?? DEFAULT_FETCH_SCHEDULE;
  const classifySchedule = process.env.NEWS_CLASSIFY_CRON ?? DEFAULT_CLASSIFY_SCHEDULE;

  cron.schedule(fetchSchedule, () => {
    void fetchAndEmbedJob();
  });
  cron.schedule(classifySchedule, () => {
    void clusterAndClassifyJob();
  });

  console.log(`[cron/news] registered (fetch="${fetchSchedule}", classify="${classifySchedule}")`);
}
