import { describe, expect, it } from "vitest";
import type { Persona } from "../schema.js";
import { syncPersonasToDb } from "../sync.js";

function makePersona(slug: string, hash: string): Persona {
  return {
    slug,
    name: `Test ${slug}`,
    worldviewTag: "tag",
    modelPreference: "claude-sonnet-4-5",
    temperature: 0.7,
    specContent: `content-${hash}`,
    specHash: hash,
    frontmatter: {} as never,
    body: "",
  };
}

function makeMockDb(existing: Array<{ slug: string; specHash: string }>) {
  const inserted: unknown[] = [];
  const updated: unknown[] = [];
  const fake = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => existing.slice(0, 1),
        }),
      }),
    }),
    insert: () => ({
      values: async (v: unknown) => {
        inserted.push(v);
      },
    }),
    update: () => ({
      set: () => ({
        where: async () => {
          updated.push(true);
        },
      }),
    }),
  };
  return { fake, inserted, updated };
}

describe("syncPersonasToDb", () => {
  it("inserts when no existing row", async () => {
    const { fake, inserted } = makeMockDb([]);
    const result = await syncPersonasToDb([makePersona("a", "h1")], fake as never);
    expect(result.created).toEqual(["a"]);
    expect(inserted).toHaveLength(1);
  });

  it("is idempotent when hash matches", async () => {
    const { fake, inserted, updated } = makeMockDb([{ slug: "a", specHash: "h1" }]);
    const result = await syncPersonasToDb([makePersona("a", "h1")], fake as never);
    expect(result.skipped).toEqual(["a"]);
    expect(inserted).toHaveLength(0);
    expect(updated).toHaveLength(0);
  });

  it("updates when hash differs", async () => {
    const { fake, updated } = makeMockDb([{ slug: "a", specHash: "old-hash" }]);
    const result = await syncPersonasToDb([makePersona("a", "new-hash")], fake as never);
    expect(result.updated).toEqual(["a"]);
    expect(updated).toHaveLength(1);
  });
});
