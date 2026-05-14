import { clusterPendingArticles } from "../pipeline/cluster.js";

async function main(): Promise<void> {
  const r = await clusterPendingArticles();
  console.log(
    `[cluster] processed=${r.processed} newClusters=${r.newClusters} appended=${r.appended}`,
  );
  process.exit(0);
}

void main();
