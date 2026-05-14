import { runFetchForBucket } from "../pipeline/fetch.js";
import { COUNTRY_BUCKETS, type CountryBucket } from "../types.js";

function parseBuckets(arg: string | undefined): CountryBucket[] {
  if (!arg) return COUNTRY_BUCKETS;
  const requested = arg.split(",").map((s) => s.trim()) as CountryBucket[];
  const allowed = new Set<string>(COUNTRY_BUCKETS);
  const out: CountryBucket[] = [];
  for (const b of requested) {
    if (allowed.has(b)) out.push(b);
    else console.warn(`[fetch] unknown bucket: ${b}`);
  }
  return out;
}

async function main(): Promise<void> {
  const buckets = parseBuckets(process.argv[2]);
  for (const b of buckets) {
    console.log(`[fetch] ${b}...`);
    try {
      const r = await runFetchForBucket(b);
      console.log(`[fetch] ${b}: fetched=${r.fetched} inserted=${r.inserted} skipped=${r.skipped}`);
    } catch (err) {
      console.error(`[fetch] ${b} failed:`, err);
    }
  }
  process.exit(0);
}

void main();
