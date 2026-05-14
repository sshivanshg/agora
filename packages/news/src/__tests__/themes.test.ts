import { describe, expect, it } from "vitest";
import { ALLOWED_THEMES, BUCKET_COUNTRY_FILTERS, DENIED_THEMES, fipsToBucket } from "../themes.js";

describe("themes", () => {
  it("allowlist is non-empty", () => {
    expect(ALLOWED_THEMES.length).toBeGreaterThan(0);
  });

  it("denylist is non-empty", () => {
    expect(DENIED_THEMES.length).toBeGreaterThan(0);
  });

  it("allow and deny lists do not overlap", () => {
    const allow = new Set(ALLOWED_THEMES);
    for (const t of DENIED_THEMES) {
      expect(allow.has(t)).toBe(false);
    }
  });

  it("entries contain no duplicates", () => {
    expect(new Set(ALLOWED_THEMES).size).toBe(ALLOWED_THEMES.length);
    expect(new Set(DENIED_THEMES).size).toBe(DENIED_THEMES.length);
  });
});

describe("bucket country filters", () => {
  it("global has no include or exclude", () => {
    const g = BUCKET_COUNTRY_FILTERS.global;
    expect(g.includeExpression).toBeNull();
    expect(g.excludeCodes ?? []).toEqual([]);
  });

  it("in/us/uk/br use single sourcecountry expressions", () => {
    expect(BUCKET_COUNTRY_FILTERS.in.includeExpression).toBe("sourcecountry:IN");
    expect(BUCKET_COUNTRY_FILTERS.us.includeExpression).toBe("sourcecountry:US");
    expect(BUCKET_COUNTRY_FILTERS.uk.includeExpression).toBe("sourcecountry:UK");
    expect(BUCKET_COUNTRY_FILTERS.br.includeExpression).toBe("sourcecountry:BR");
  });

  it("eu uses an OR group of FIPS codes", () => {
    const expr = BUCKET_COUNTRY_FILTERS.eu.includeExpression;
    expect(expr).toContain("sourcecountry:FR");
    expect(expr).toContain("sourcecountry:GM");
    expect(expr).toContain("sourcecountry:SW");
  });

  it("other declares excludeCodes covering the named buckets", () => {
    const o = BUCKET_COUNTRY_FILTERS.other;
    expect(o.includeExpression).toBeNull();
    const excl = new Set(o.excludeCodes ?? []);
    for (const c of ["IN", "US", "UK", "BR", "FR", "GM"]) {
      expect(excl.has(c)).toBe(true);
    }
  });
});

describe("fipsToBucket", () => {
  it("maps known FIPS codes to buckets", () => {
    expect(fipsToBucket("IN")).toBe("in");
    expect(fipsToBucket("US")).toBe("us");
    expect(fipsToBucket("UK")).toBe("uk");
    expect(fipsToBucket("BR")).toBe("br");
    expect(fipsToBucket("FR")).toBe("eu");
    expect(fipsToBucket("GM")).toBe("eu");
    expect(fipsToBucket("CA")).toBe("other");
  });

  it("is case-insensitive", () => {
    expect(fipsToBucket("us")).toBe("us");
  });
});
