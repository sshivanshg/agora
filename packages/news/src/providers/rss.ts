import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { fipsToBucket } from "../themes.js";
import type { CountryBucket, FetchOptions, NewsProvider, RawArticle } from "../types.js";
import { RSS_FEEDS, type RssFeedEntry } from "./rss-registry.js";

const REQUEST_TIMEOUT_MS = 60_000;

interface RssItem {
  title?: string | { "#text"?: string };
  link?: string;
  description?: string;
  pubDate?: string;
  "dc:date"?: string;
  guid?: string | { "#text"?: string };
}

interface RssChannel {
  item?: RssItem | RssItem[];
}

interface RssDocument {
  rss?: { channel?: RssChannel };
  feed?: { entry?: RssItem | RssItem[] };
}

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

function textOf(field: RssItem["title"]): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field["#text"] ?? "";
}

function parseDate(s?: string): Date {
  if (!s) return new Date();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

async function fetchFeed(entry: RssFeedEntry): Promise<RssItem[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(entry.url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Agora-NewsFetcher/1.0 (+https://agora.local)" },
    });
    if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(xml) as RssDocument;
    const items = parsed.rss?.channel?.item ?? parsed.feed?.entry;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } finally {
    clearTimeout(timer);
  }
}

export class RssProvider implements NewsProvider {
  name = "rss";

  async fetchTrending(country: CountryBucket, options?: FetchOptions): Promise<RawArticle[]> {
    const feeds = RSS_FEEDS[country] ?? [];
    if (feeds.length === 0) return [];

    const limit = options?.maxResults ?? 100;
    const seenUrls = new Set<string>();
    const articles: RawArticle[] = [];

    for (const feed of feeds) {
      try {
        const items = await fetchFeed(feed);
        for (const item of items) {
          if (articles.length >= limit) break;
          const url = item.link;
          if (!url) continue;
          if (seenUrls.has(url)) continue;
          seenUrls.add(url);

          const title = textOf(item.title);
          if (!title) continue;

          const domain = domainOf(url);
          if (!domain) continue;

          const raw: RawArticle = {
            id: hashId(url),
            url,
            title,
            sourceDomain: domain,
            sourceName: feed.name,
            country: "",
            countryBucket: country,
            language: "eng",
            publishedAt: parseDate(item.pubDate ?? item["dc:date"]),
          };
          if (item.description) raw.description = item.description;
          articles.push(raw);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[news/rss] feed ${feed.url} failed: ${msg}`);
      }
      if (articles.length >= limit) break;
    }
    return articles;
  }
}

/**
 * Build a quick description-lookup map for a country bucket by
 * fetching all RSS feeds and indexing by URL. Used to enrich
 * GDELT results which lack a description.
 */
export async function enrichFromRss(
  bucket: CountryBucket,
): Promise<Map<string, { description?: string; sourceName?: string }>> {
  const out = new Map<string, { description?: string; sourceName?: string }>();
  const feeds = RSS_FEEDS[bucket] ?? [];
  for (const feed of feeds) {
    try {
      const items = await fetchFeed(feed);
      for (const item of items) {
        if (!item.link) continue;
        const entry: { description?: string; sourceName?: string } = { sourceName: feed.name };
        if (item.description) entry.description = item.description;
        out.set(item.link, entry);
      }
    } catch {
      /* swallow per-feed */
    }
  }
  return out;
}

// Surface fipsToBucket re-export for symmetry — RSS doesn't use it but
// downstream callers may want it adjacent.
export { fipsToBucket };
