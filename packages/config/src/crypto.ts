import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // bytes
const IV_LENGTH = 12; // bytes (96 bits recommended for GCM)
const TAG_LENGTH = 16; // bytes

function getEncryptionKey(): Buffer {
  const raw = process.env.INSTANCE_ENCRYPTION_KEY;
  if (!raw) throw new Error("INSTANCE_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `INSTANCE_ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH} bytes ` +
        `(got ${key.length}). Run: pnpm gen:encryption-key`,
    );
  }
  return key;
}

export interface EncryptedValue {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

export function encryptApiKey(plaintext: string): EncryptedValue {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptApiKey(input: EncryptedValue): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(input.iv, "base64");
  const authTag = Buffer.from(input.authTag, "base64");
  const ciphertext = Buffer.from(input.ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}
