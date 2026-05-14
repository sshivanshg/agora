import { classifyPendingClusters } from "../pipeline/classify.js";

async function main(): Promise<void> {
  const r = await classifyPendingClusters();
  console.log(
    `[classify] classified=${r.classified} debatable=${r.debatable} rejected=${r.rejected} errors=${r.errors}`,
  );
  process.exit(0);
}

void main();
