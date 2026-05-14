import { articles, db, desc, eq, isNull } from "@agora/db";
import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";

const EMBED_BATCH_LIMIT = 50;
const EMBED_MODEL = "text-embedding-3-small";

async function getOpenAiApiKey(): Promise<string | null> {
  // The shared @agora/ai keys module exposes getActiveKey; rather than
  // importing it directly (and forcing a model-registry lookup), we read
  // the provider_keys row ourselves. Soft-fail if not configured.
  const { providerKeys } = await import("@agora/db");
  const { decryptApiKey } = await import("@agora/config/crypto");
  const rows = await db
    .select()
    .from(providerKeys)
    .where(eq(providerKeys.provider, "openai"))
    .limit(1);
  const row = rows[0];
  if (!row || !row.isActive) return null;
  try {
    return decryptApiKey({
      ciphertext: row.encryptedKey,
      iv: row.encryptionIv,
      authTag: row.encryptionAuthTag,
    });
  } catch {
    return null;
  }
}

export interface EmbedStageResult {
  embedded: number;
  skipped: boolean;
  reason?: string;
}

export async function embedPendingArticles(): Promise<EmbedStageResult> {
  const apiKey = await getOpenAiApiKey();
  if (!apiKey) {
    console.warn("[news/embed] no OpenAI key configured — skipping");
    return { embedded: 0, skipped: true, reason: "no_openai_key" };
  }

  const pending = await db
    .select({ id: articles.id, title: articles.title })
    .from(articles)
    .where(isNull(articles.embedding))
    .orderBy(desc(articles.createdAt))
    .limit(EMBED_BATCH_LIMIT);

  if (pending.length === 0) return { embedded: 0, skipped: false };

  const openai = createOpenAI({ apiKey });
  const embedder = openai.embedding(EMBED_MODEL);

  const { embeddings } = await embedMany({
    model: embedder,
    values: pending.map((p) => p.title),
  });

  let embedded = 0;
  for (let i = 0; i < pending.length; i++) {
    const row = pending[i];
    const vec = embeddings[i];
    if (!row || !vec) continue;
    await db.update(articles).set({ embedding: vec }).where(eq(articles.id, row.id));
    embedded++;
  }
  return { embedded, skipped: false };
}
