import { describe, expect, it } from "vitest";
import { estimateCost } from "../cost";

describe("estimateCost", () => {
  it("computes claude-sonnet-4-5 cost correctly", () => {
    // 1M in @ $3 + 0.5M out @ $15 = $3 + $7.5 = $10.5
    const cost = estimateCost(
      { provider: "anthropic", model: "claude-sonnet-4-5" },
      1_000_000,
      500_000,
    );
    expect(cost).toBeCloseTo(10.5);
  });
  it("returns 0 for ollama", () => {
    expect(estimateCost({ provider: "ollama", model: "llama3.3" }, 100_000, 100_000)).toBe(0);
  });
  it("returns 0 for unknown model", () => {
    expect(estimateCost({ provider: "anthropic", model: "made-up" }, 1000, 1000)).toBe(0);
  });
});
