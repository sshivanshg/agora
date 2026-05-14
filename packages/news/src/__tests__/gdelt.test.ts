import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GdeltProvider, buildGdeltQuery, parseGdeltDate } from "../providers/gdelt.js";

describe("buildGdeltQuery", () => {
  it("includes themeClause and sourcelang for global", () => {
    const q = buildGdeltQuery("global");
    expect(q).toContain("theme:LEGISLATION");
    expect(q).toContain("sourcelang:eng");
    expect(q).not.toContain("sourcecountry:");
  });

  it("includes sourcecountry filter for in/us/uk/br", () => {
    expect(buildGdeltQuery("in")).toContain("sourcecountry:IN");
    expect(buildGdeltQuery("us")).toContain("sourcecountry:US");
    expect(buildGdeltQuery("uk")).toContain("sourcecountry:UK");
    expect(buildGdeltQuery("br")).toContain("sourcecountry:BR");
  });

  it("uses an OR group for eu", () => {
    const q = buildGdeltQuery("eu");
    expect(q).toMatch(/\(sourcecountry:FR OR/);
    expect(q).toContain("sourcecountry:SW");
  });

  it("uses a negation expression for other", () => {
    const q = buildGdeltQuery("other");
    expect(q).toContain("-(sourcecountry:IN OR");
  });
});

describe("parseGdeltDate", () => {
  it("parses GDELT timestamp format", () => {
    const d = parseGdeltDate("20250603T141530Z");
    expect(d.toISOString()).toBe("2025-06-03T14:15:30.000Z");
  });

  it("falls back to ISO 8601 parsing", () => {
    const d = parseGdeltDate("2025-06-03T14:15:30Z");
    expect(d.toISOString()).toBe("2025-06-03T14:15:30.000Z");
  });

  it("roundtrips through Date.toISOString", () => {
    const original = new Date("2025-06-03T14:15:30.000Z");
    const formatted = `${original.toISOString().replace(/[-:.]/g, "").slice(0, 15)}Z`;
    // formatted is "20250603T141530000Z" — slice fixes to 15 chars before Z
    const sanitized = `${formatted.slice(0, 15)}Z`;
    const reparsed = parseGdeltDate(sanitized);
    expect(reparsed.getUTCFullYear()).toBe(2025);
    expect(reparsed.getUTCMonth()).toBe(5);
    expect(reparsed.getUTCDate()).toBe(3);
  });
});

describe("GdeltProvider.fetchTrending (mocked)", () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    global.fetch = realFetch;
    vi.useRealTimers();
  });

  it("normalizes article rows and never hits the network", async () => {
    const mockJson = {
      articles: [
        {
          url: "https://www.bbc.co.uk/news/test-article",
          title: "A serious policy debate",
          seendate: "20250603T141530Z",
          domain: "bbc.co.uk",
          language: "English",
          sourcecountry: "United Kingdom",
        },
      ],
    };
    global.fetch = vi.fn(
      async () => new Response(JSON.stringify(mockJson), { status: 200 }),
    ) as unknown as typeof fetch;

    const p = new GdeltProvider();
    const out = await p.fetchTrending("uk", { timespan: "6h", maxResults: 10 });
    expect(out).toHaveLength(1);
    const article = out[0];
    expect(article).toBeDefined();
    if (!article) throw new Error("unreachable");
    expect(article.sourceName).toBe("BBC");
    expect(article.sourceDomain).toBe("bbc.co.uk");
    expect(article.countryBucket).toBe("uk");
    expect(article.title).toBe("A serious policy debate");
    expect(article.id).toHaveLength(24);
  });

  it("returns [] when GDELT returns empty", async () => {
    global.fetch = vi.fn(async () => new Response("", { status: 200 })) as unknown as typeof fetch;
    const p = new GdeltProvider();
    const out = await p.fetchTrending("global");
    expect(out).toEqual([]);
  });

  it("returns [] when JSON contains no articles", async () => {
    global.fetch = vi.fn(
      async () => new Response(JSON.stringify({}), { status: 200 }),
    ) as unknown as typeof fetch;
    const p = new GdeltProvider();
    const out = await p.fetchTrending("us");
    expect(out).toEqual([]);
  });
});
