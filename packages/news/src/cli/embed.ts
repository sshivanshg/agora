import { embedPendingArticles } from "../pipeline/embed.js";

async function main(): Promise<void> {
  const r = await embedPendingArticles();
  if (r.skipped) {
    console.log(`[embed] skipped: ${r.reason ?? "unknown"}`);
  } else {
    console.log(`[embed] embedded=${r.embedded}`);
  }
  process.exit(0);
}

void main();
