import type { CountryBucket, FetchOptions, NewsProvider, RawArticle } from "../types.js";

export class MediaStackProvider implements NewsProvider {
  name = "mediastack";

  async fetchTrending(_country: CountryBucket, _options?: FetchOptions): Promise<RawArticle[]> {
    throw new Error("not yet implemented — see docs/news-providers.md");
  }
}
