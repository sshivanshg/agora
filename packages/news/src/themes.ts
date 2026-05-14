import type { CountryBucket } from "./types.js";

/**
 * Curated GDELT theme allowlist. These themes correlate with
 * civically-significant, debatable subject matter.
 */
export const ALLOWED_THEMES: string[] = [
  "LEGISLATION",
  "ELECTION",
  "ECON_TAXATION",
  "ECON_INFLATION",
  "ECON_INTEREST_RATES",
  "ECON_UNEMPLOYMENT",
  "ENV_CLIMATECHANGE",
  "ENV_GREEN",
  "ENV_REGULATION",
  "GOVERNMENT",
  "DEMOCRACY",
  "CONSTITUTIONAL",
  "HUMAN_RIGHTS",
  "FREEDOM_OF_THE_PRESS",
  "EDUCATION",
  "HEALTH",
  "WB_658_PUBLIC_HEALTH",
  "IMMIGRATION",
  "TRADE",
  "TAX_FNCACT",
  "USPEC_POLICY1",
  "WB_2670_JOBS",
  "WB_2024_ANTI_CORRUPTION",
  "CRIME",
  "JUSTICE",
  "LABOR_DISPUTE",
  "PROTEST",
  "TAX_RELIGION",
];

/**
 * Curated GDELT theme denylist. Articles dominated by these
 * are unlikely to anchor a productive debate.
 */
export const DENIED_THEMES: string[] = [
  "SPORTS",
  "ENTERTAINMENT",
  "CELEBRITY",
  "TAX_FNCACT_CELEBRITY",
  "EPU_POLICY_CELEBRITY",
  "FASHION",
  "LIFESTYLE",
  "MOVIES",
  "MUSIC",
  "TELEVISION",
  "GAMING",
  "ANIMAL_WELFARE_AND_RIGHTS",
];

/**
 * GDELT FIPS country filter expression per bucket.
 * `null` ⇒ apply no sourcecountry filter.
 * `excludeCodes` ⇒ build a NOT (sourcecountry:X OR sourcecountry:Y …) expression.
 */
export interface BucketCountryFilter {
  bucket: CountryBucket;
  includeExpression: string | null;
  excludeCodes?: string[];
}

const EU_FIPS = ["FR", "GM", "IT", "SP", "NL", "PL", "BE", "PO", "GR", "AU", "SW"];

export const BUCKET_COUNTRY_FILTERS: Record<CountryBucket, BucketCountryFilter> = {
  global: { bucket: "global", includeExpression: null },
  in: { bucket: "in", includeExpression: "sourcecountry:IN" },
  us: { bucket: "us", includeExpression: "sourcecountry:US" },
  uk: { bucket: "uk", includeExpression: "sourcecountry:UK" },
  eu: {
    bucket: "eu",
    includeExpression: `(${EU_FIPS.map((c) => `sourcecountry:${c}`).join(" OR ")})`,
  },
  br: { bucket: "br", includeExpression: "sourcecountry:BR" },
  other: {
    bucket: "other",
    includeExpression: null,
    excludeCodes: ["IN", "US", "UK", "BR", ...EU_FIPS],
  },
};

/**
 * Map a GDELT sourcecountry FIPS code → our CountryBucket.
 */
export function fipsToBucket(fips: string): CountryBucket {
  const c = fips.toUpperCase();
  if (c === "IN") return "in";
  if (c === "US") return "us";
  if (c === "UK") return "uk";
  if (c === "BR") return "br";
  if (EU_FIPS.includes(c)) return "eu";
  return "other";
}
