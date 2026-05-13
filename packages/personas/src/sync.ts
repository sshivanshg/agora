import { db, eq, personas } from "@agora/db";
import type { Persona } from "./schema.js";

export interface SyncResult {
  created: string[];
  updated: string[];
  skipped: string[];
}

export async function syncPersonasToDb(
  personasToSync: Persona[],
  database: typeof db = db,
): Promise<SyncResult> {
  const result: SyncResult = { created: [], updated: [], skipped: [] };
  for (const p of personasToSync) {
    const [existing] = await database
      .select()
      .from(personas)
      .where(eq(personas.slug, p.slug))
      .limit(1);
    if (!existing) {
      await database.insert(personas).values({
        slug: p.slug,
        name: p.name,
        worldviewTag: p.worldviewTag,
        specContent: p.specContent,
        specHash: p.specHash,
        modelPreference: p.modelPreference,
        temperature: p.temperature,
        isActive: true,
      });
      result.created.push(p.slug);
    } else if (existing.specHash === p.specHash) {
      result.skipped.push(p.slug);
    } else {
      await database
        .update(personas)
        .set({
          name: p.name,
          worldviewTag: p.worldviewTag,
          specContent: p.specContent,
          specHash: p.specHash,
          modelPreference: p.modelPreference,
          temperature: p.temperature,
          updatedAt: new Date(),
        })
        .where(eq(personas.slug, p.slug));
      result.updated.push(p.slug);
    }
  }
  return result;
}
