import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { type Persona, personaFrontmatterSchema } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SPECS_DIR = join(__dirname, "..", "specs");

export function loadPersonasFromDisk(specsDir = SPECS_DIR): Persona[] {
  const files = readdirSync(specsDir).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const fullPath = join(specsDir, file);
    const raw = readFileSync(fullPath, "utf8");
    const parsed = matter(raw);
    const result = personaFrontmatterSchema.safeParse(parsed.data);
    if (!result.success) {
      throw new Error(
        `Invalid persona frontmatter in ${file}: ${JSON.stringify(result.error.flatten(), null, 2)}`,
      );
    }
    const fm = result.data;
    return {
      slug: fm.id,
      name: fm.name,
      worldviewTag: fm.worldview_tag,
      modelPreference: fm.model_preference,
      temperature: fm.temperature,
      specContent: raw,
      specHash: createHash("sha256").update(raw).digest("hex"),
      frontmatter: fm,
      body: parsed.content,
    };
  });
}
