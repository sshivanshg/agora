import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPersonasFromDisk } from "../loader.js";

const VALID_FM = `---
id: test-persona
name: The Tester
worldview_tag: Testing matters
epistemic_style: Hypothesis-driven
core_values:
  - correctness
characteristic_concerns:
  - flaky tests
rhetorical_signature: Crisp
blind_spots:
  - over-testing trivial code
model_preference: claude-sonnet-4-5
temperature: 0.7
---

# System Prompt
Body content here.
`;

describe("loadPersonasFromDisk", () => {
  it("loads and validates the 4 canonical specs", () => {
    const personas = loadPersonasFromDisk();
    expect(personas).toHaveLength(4);
    const slugs = personas.map((p) => p.slug).sort();
    expect(slugs).toEqual([
      "classical-liberal",
      "conservative-traditionalist",
      "progressive-reformer",
      "technocrat",
    ]);
    for (const p of personas) {
      expect(p.specHash).toMatch(/^[a-f0-9]{64}$/);
      expect(p.specContent.length).toBeGreaterThan(100);
      expect(p.modelPreference).toBeTruthy();
    }
  });

  it("computes different hashes for different content", () => {
    const dir = mkdtempSync(join(tmpdir(), "personas-"));
    writeFileSync(join(dir, "a.md"), VALID_FM);
    writeFileSync(join(dir, "b.md"), VALID_FM.replace("Body content here.", "Different body."));
    const personas = loadPersonasFromDisk(dir);
    expect(personas[0]?.specHash).not.toBe(personas[1]?.specHash);
    rmSync(dir, { recursive: true });
  });

  it("throws on missing required field with file name in error", () => {
    const dir = mkdtempSync(join(tmpdir(), "personas-"));
    const bad = VALID_FM.replace(/temperature: 0\.7\n/, "");
    writeFileSync(join(dir, "bad.md"), bad);
    expect(() => loadPersonasFromDisk(dir)).toThrow(/bad\.md/);
    rmSync(dir, { recursive: true });
  });
});
