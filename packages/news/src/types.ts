export type CountryBucket = "global" | "in" | "us" | "uk" | "eu" | "br" | "other";

export const COUNTRY_BUCKETS: CountryBucket[] = ["global", "in", "us", "uk", "eu", "br", "other"];

export interface RawArticle {
  /** sha256(url).slice(0, 24) — stable short id */
  id: string;
  url: string;
  title: string;
  description?: string;
  sourceName: string;
  sourceDomain: string;
  country: string;
  countryBucket: CountryBucket;
  language: string;
  publishedAt: Date;
  themes?: string[];
}

export interface FetchOptions {
  timespan?: string;
  maxResults?: number;
}

export interface NewsProvider {
  name: string;
  fetchTrending(country: CountryBucket, options?: FetchOptions): Promise<RawArticle[]>;
}
