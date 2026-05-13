import { decryptApiKey } from "@agora/config";
import { and, db, desc, eq, providerKeys } from "@agora/db";
import type { ProviderId } from "./registry";

export interface DecryptedKey {
  provider: ProviderId;
  baseUrl: string | null;
  /** Plaintext key. Never log. Never serialize. */
  readonly apiKey: string;
}

export class NoActiveKeyError extends Error {
  constructor(provider: string) {
    super(`No active API key for provider: ${provider}`);
    this.name = "NoActiveKeyError";
  }
}

export async function getActiveKey(provider: ProviderId): Promise<DecryptedKey> {
  const rows = await db
    .select()
    .from(providerKeys)
    .where(and(eq(providerKeys.provider, provider), eq(providerKeys.isActive, true)))
    .orderBy(desc(providerKeys.lastUsedAt))
    .limit(1);

  const row = rows[0];
  if (!row) throw new NoActiveKeyError(provider);

  const plaintext = decryptApiKey({
    ciphertext: row.encryptedKey,
    iv: row.encryptionIv,
    authTag: row.encryptionAuthTag,
  });

  // Fire-and-forget update of lastUsedAt
  void Promise.resolve(
    db.update(providerKeys).set({ lastUsedAt: new Date() }).where(eq(providerKeys.id, row.id)),
  ).catch(() => {
    // ignore — best-effort tracking
  });

  // Closure over plaintext; expose only via getter to discourage stringification
  const baseUrl = row.baseUrl;
  return {
    provider,
    baseUrl,
    get apiKey() {
      return plaintext;
    },
    toJSON() {
      return { provider, baseUrl, apiKey: "[REDACTED]" };
    },
  } as DecryptedKey;
}
