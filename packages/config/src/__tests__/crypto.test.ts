import { beforeAll, describe, expect, it } from "vitest";
import { decryptApiKey, encryptApiKey } from "../crypto";

beforeAll(() => {
  // Set a test key: exactly 32 bytes encoded as base64
  process.env.INSTANCE_ENCRYPTION_KEY = Buffer.from("a".repeat(32)).toString("base64");
});

describe("encryptApiKey / decryptApiKey", () => {
  it("round-trips a plaintext key", () => {
    const plaintext = "sk-ant-api03-test-key-1234567890";
    const encrypted = encryptApiKey(plaintext);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext on each call (random IV)", () => {
    const plaintext = "same-key";
    const a = encryptApiKey(plaintext);
    const b = encryptApiKey(plaintext);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptApiKey("my-api-key");
    const tampered = {
      ...encrypted,
      ciphertext: Buffer.from("tampered").toString("base64"),
    };
    expect(() => decryptApiKey(tampered)).toThrow();
  });

  it("throws on wrong auth tag", () => {
    const encrypted = encryptApiKey("my-api-key");
    const tampered = {
      ...encrypted,
      authTag: Buffer.from("wrongauthtagwrong").toString("base64"),
    };
    expect(() => decryptApiKey(tampered)).toThrow();
  });
});
