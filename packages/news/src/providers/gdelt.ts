import { createHash } from "node:crypto";
import { ALLOWED_THEMES, BUCKET_COUNTRY_FILTERS, fipsToBucket } from "../themes.js";
import type { CountryBucket, FetchOptions, NewsProvider, RawArticle } from "../types.js";

const GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";
const DEFAULT_TIMESPAN = "6h";
const DEFAULT_MAXRECORDS = 250;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2_000;

const KNOWN_PUBLISHERS: Record<string, string> = {
  "bbc.co.uk": "BBC",
  "bbc.com": "BBC",
  "reuters.com": "Reuters",
  "thehindu.com": "The Hindu",
  "indianexpress.com": "Indian Express",
  "npr.org": "NPR",
  "washingtonpost.com": "Washington Post",
  "apnews.com": "AP",
  "theguardian.com": "The Guardian",
  "aljazeera.com": "Al Jazeera",
  "nytimes.com": "The New York Times",
  "wsj.com": "The Wall Street Journal",
  "ft.com": "Financial Times",
  "economist.com": "The Economist",
};

/**
 * GDELT sometimes returns the sourcecountry as a verbose
 * English name. This small lookup maps the names we observe
 * most often back to their FIPS codes.
 */
const COUNTRY_NAME_TO_FIPS: Record<string, string> = {
  india: "IN",
  "united states": "US",
  usa: "US",
  "united kingdom": "UK",
  "great britain": "UK",
  britain: "UK",
  brazil: "BR",
  france: "FR",
  germany: "GM",
  italy: "IT",
  spain: "SP",
  netherlands: "NL",
  poland: "PL",
  belgium: "BE",
  portugal: "PO",
  greece: "GR",
  austria: "AU",
  sweden: "SW",
};

function hashId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 24);
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function capitalizeDomainRoot(domain: string): string {
  const root = domain.split(".")[0] ?? domain;
  return root.charAt(0).toUpperCase() + root.slice(1);
}

function deriveSourceName(domain: string): string {
  if (KNOWN_PUBLISHERS[domain]) return KNOWN_PUBLISHERS[domain];
  // Match suffix (e.g. news.bbc.co.uk → bbc.co.uk)
  for (const k of Object.keys(KNOWN_PUBLISHERS)) {
    if (domain.endsWith(`.${k}`)) {
      const v = KNOWN_PUBLISHERS[k];
      if (v) return v;
    }
  }
  return capitalizeDomainRoot(domain);
}

function normalizeCountry(raw: string | undefined): { fips: string; bucket: CountryBucket } {
  if (!raw) return { fips: "", bucket: "other" };
  const trimmed = raw.trim();
  if (trimmed.length === 2 || trimmed.length === 3) {
    return { fips: trimmed.toUpperCase(), bucket: fipsToBucket(trimmed) };
  }
  const fips = COUNTRY_NAME_TO_FIPS[trimmed.toLowerCase()];
  if (fips) return { fips, bucket: fipsToBucket(fips) };
  return { fips: trimmed.slice(0, 2).toUpperCase(), bucket: "other" };
}

/**
 * Parse a GDELT-formatted timestamp (e.g. "20250603T141500Z") into a Date.
 * Falls back to current time on parse failure.
 */
export function parseGdeltDate(raw: string): Date {
  // Accept "YYYYMMDDTHHMMSSZ"
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (m) {
    const [, y, mo, d, h, mi, s] = m;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  }
  // Accept ISO 8601 fallback
  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;
  return new Date();
}

export function buildGdeltQuery(bucket: CountryBucket): string {
  const themeClause = `(${ALLOWED_THEMES.map((t) => `theme:${t}`).join(" OR ")})`;
  const filter = BUCKET_COUNTRY_FILTERS[bucket];

  const parts: string[] = [themeClause];
  if (filter.includeExpression) parts.push(filter.includeExpression);
  if (filter.excludeCodes?.length) {
    const excl = `-(${filter.excludeCodes.map((c) => `sourcecountry:${c}`).join(" OR ")})`;
    parts.push(excl);
  }
  parts.push("sourcelang:eng");
  return parts.join(" ");
}

interface GdeltArticleRow {
  url?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

interface GdeltResponse {
  articles?: GdeltArticleRow[];
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Agora-NewsFetcher/1.0 (+https://agora.local)" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetries(url: string): Promise<GdeltResponse> {
  let backoff = INITIAL_BACKOFF_MS;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
      if (!res.ok) {
        throw new Error(`GDELT HTTP ${res.status}`);
      }
      const text = await res.text();
      if (!text.trim()) return { articles: [] };
      // GDELT occasionally returns malformed JSON if the query yields nothing
      try {
        return JSON.parse(text) as GdeltResponse;
      } catch {
        return { articles: [] };
      }
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_RETRIES) break;
      await new Promise((r) => setTimeout(r, backoff));
      backoff *= 2;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("GDELT fetch failed");
}

export class GdeltProvider implements NewsProvider {
  name = "gdelt";

  async fetchTrending(country: CountryBucket, options?: FetchOptions): Promise<RawArticle[]> {
    const query = buildGdeltQuery(country);
    const params = new URLSearchParams({
      query,
      mode: "ArtList",
      format: "json",
      maxrecords: String(options?.maxResults ?? DEFAULT_MAXRECORDS),
      timespan: options?.timespan ?? DEFAULT_TIMESPAN,
      sort: "hybridrel",
    });
    const url = `${GDELT_ENDPOINT}?${params.toString()}`;

    const json = await fetchWithRetries(url);
    const rows = Array.isArray(json.articles) ? json.articles : [];
    if (rows.length === 0) return [];

    const seen = new Set<string>();
    const articles: RawArticle[] = [];
    for (const row of rows) {
      if (!row.url || !row.title) continue;
      if (seen.has(row.url)) continue;
      seen.add(row.url);

      const domain = (row.domain ?? domainOf(row.url)).toLowerCase();
      if (!domain) continue;

      const { fips, bucket } = normalizeCountry(row.sourcecountry);
      const finalBucket: CountryBucket = country === "global" ? bucket : country;

      articles.push({
        id: hashId(row.url),
        url: row.url,
        title: row.title,
        sourceDomain: domain,
        sourceName: deriveSourceName(domain),
        country: fips,
        countryBucket: finalBucket,
        language: row.language ?? "eng",
        publishedAt: parseGdeltDate(row.seendate ?? ""),
      });
    }
    return articles;
  }
}
