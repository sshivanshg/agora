import type { CountryBucket } from "../types.js";

export interface RssFeedEntry {
  url: string;
  name: string;
}

export const RSS_FEEDS: Record<CountryBucket, RssFeedEntry[]> = {
  global: [
    { url: "https://feeds.reuters.com/reuters/topNews", name: "Reuters" },
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC" },
    { url: "https://www.aljazeera.com/xml/rss/all.xml", name: "Al Jazeera" },
  ],
  in: [
    { url: "https://www.thehindu.com/news/national/feeder/default.rss", name: "The Hindu" },
    { url: "https://indianexpress.com/section/india/feed/", name: "Indian Express" },
  ],
  us: [
    { url: "https://feeds.npr.org/1001/rss.xml", name: "NPR" },
    { url: "https://feeds.washingtonpost.com/rss/politics", name: "Washington Post" },
    { url: "https://feeds.apnews.com/rss/apf-topnews", name: "AP" },
  ],
  uk: [
    { url: "https://feeds.bbci.co.uk/news/uk/rss.xml", name: "BBC UK" },
    { url: "https://www.theguardian.com/uk/rss", name: "The Guardian" },
  ],
  eu: [],
  br: [],
  other: [],
};
