import { describe, expect, it } from "vitest";
import { MODEL_CATALOG, findModel, listModels } from "../registry";

describe("registry", () => {
  it("catalog is non-empty", () => {
    expect(MODEL_CATALOG.length).toBeGreaterThan(5);
  });
  it("findModel returns metadata", () => {
    const m = findModel({ provider: "anthropic", model: "claude-sonnet-4-5" });
    expect(m).toBeDefined();
    expect(m?.inputPricePerM).toBeGreaterThan(0);
  });
  it("listModels filters by provider", () => {
    const anthropic = listModels("anthropic");
    expect(anthropic.length).toBeGreaterThan(0);
    expect(anthropic.every((m) => m.provider === "anthropic")).toBe(true);
  });
});
