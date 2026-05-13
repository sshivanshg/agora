import { loadPersonasFromDisk } from "./loader.js";
import { syncPersonasToDb } from "./sync.js";

async function main() {
  console.log("Loading personas from disk...");
  const personas = loadPersonasFromDisk();
  console.log(`Found ${personas.length} personas: ${personas.map((p) => p.slug).join(", ")}`);
  console.log("Syncing to database...");
  const result = await syncPersonasToDb(personas);
  console.log(`Created: ${result.created.length} ${result.created.join(", ")}`);
  console.log(`Updated: ${result.updated.length} ${result.updated.join(", ")}`);
  console.log(`Skipped: ${result.skipped.length} ${result.skipped.join(", ")}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
