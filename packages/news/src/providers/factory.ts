import type { NewsProvider } from "../types.js";
import { GdeltProvider } from "./gdelt.js";
import { GNewsProvider } from "./gnews.js";
import { MediaStackProvider } from "./mediastack.js";
import { RssProvider } from "./rss.js";

export function createNewsProvider(name?: string): NewsProvider {
  const provider = (name ?? process.env.NEWS_PROVIDER ?? "gdelt").toLowerCase();
  switch (provider) {
    case "gdelt":
      return new GdeltProvider();
    case "rss":
    case "rss-only":
      return new RssProvider();
    case "gnews":
      return new GNewsProvider();
    case "mediastack":
      return new MediaStackProvider();
    default:
      throw new Error(`Unknown NEWS_PROVIDER: ${provider}`);
  }
}
