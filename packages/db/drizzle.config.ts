import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Config } from "drizzle-kit";

/** Load `.env` from cwd and parent dirs (nearest file wins); only sets empty/missing env keys. */
function applyAncestorEnvFiles(): void {
  const paths: string[] = [];
  let dir = resolve(process.cwd());
  for (let i = 0; i < 8; i++) {
    const candidate = resolve(dir, ".env");
    if (existsSync(candidate)) paths.push(candidate);
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  const merged: Record<string, string> = {};
  for (const filePath of [...paths].reverse()) {
    const text = readFileSync(filePath, "utf8");
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line
        .slice(0, eq)
        .trim()
        .replace(/^export\s+/i, "");
      if (!key) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      merged[key] = value;
    }
  }
  for (const [key, value] of Object.entries(merged)) {
    const current = process.env[key];
    if (current === undefined || current === "") {
      process.env[key] = value;
    }
  }
}

applyAncestorEnvFiles();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.trim()) {
  throw new Error(
    "DATABASE_URL is missing or empty. Copy .env.example to .env at the repo root and set DATABASE_URL before running db:push.",
  );
}

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;
