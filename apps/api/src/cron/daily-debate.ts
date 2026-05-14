// TODO: move to a dedicated worker process in a future hosted-mode phase.
import { and, clusters, db, desc, eq, gte, instanceConfig, isNotNull, isNull } from "@agora/db";
import cron from "node-cron";
import { createDebateFromClusterId } from "../routes/news.js";

const DEFAULT_SCHEDULE = "0 6 * * *";
const DEFAULT_COUNTRIES = ["global"];

async function readCountries(): Promise<string[]> {
  const [row] = await db
    .select()
    .from(instanceConfig)
    .where(eq(instanceConfig.key, "daily_debate_countries"))
    .limit(1);
  if (!row) return DEFAULT_COUNTRIES;
  const v = row.value as unknown;
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return DEFAULT_COUNTRIES;
}

async function dailyDebateJob(): Promise<void> {
  console.log("[cron/daily-debate] start");
  const countries = await readCountries();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const country of countries) {
    try {
      const [candidate] = await db
        .select()
        .from(clusters)
        .where(
          and(
            eq(clusters.countryBucket, country),
            eq(clusters.isDebatable, true),
            isNotNull(clusters.resolution),
            isNull(clusters.debateId),
            gte(clusters.firstSeenAt, since),
          ),
        )
        .orderBy(desc(clusters.trendingScore), desc(clusters.lastUpdatedAt))
        .limit(1);

      if (!candidate) {
        console.log(`[cron/daily-debate] ${country}: no eligible cluster`);
        continue;
      }

      const result = await createDebateFromClusterId(candidate.id);
      if (result.ok) {
        console.log(`[cron/daily-debate] ${country}: started debate ${result.debateId}`);
      } else {
        console.log(
          `[cron/daily-debate] ${country}: skipped (${result.status}) ${JSON.stringify(result.body)}`,
        );
      }
    } catch (err) {
      console.error(`[cron/daily-debate] ${country} failed:`, err);
    }
  }
}

export function registerDailyDebateCron(): void {
  const schedule = process.env.DAILY_DEBATE_CRON ?? DEFAULT_SCHEDULE;
  cron.schedule(schedule, () => {
    void dailyDebateJob();
  });
  console.log(`[cron/daily-debate] registered (schedule="${schedule}")`);
}
