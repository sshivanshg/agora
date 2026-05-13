import { encryptApiKey } from "@agora/config/crypto";
import { db } from "@agora/db";
import { instanceConfig, providerKeys } from "@agora/db";
import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Owner, OwnerEnv } from "../middleware/owner.js";

export const setupRouter = new Hono<OwnerEnv>();

const PROVIDERS = ["anthropic", "openai", "google", "groq", "ollama", "custom"] as const;

setupRouter.get("/status", async (c) => {
  const completed = await db
    .select()
    .from(instanceConfig)
    .where(eq(instanceConfig.key, "setup_completed"))
    .limit(1);

  const keys = await db
    .select({ provider: providerKeys.provider })
    .from(providerKeys)
    .where(eq(providerKeys.isActive, true));

  return c.json({
    completed: completed[0]?.value === true,
    hasAnyKey: keys.length > 0,
    providers: [...new Set(keys.map((k) => k.provider))],
  });
});

setupRouter.post(
  "/provider-key",
  zValidator(
    "json",
    z.object({
      provider: z.enum(PROVIDERS),
      label: z.string().min(1).max(100),
      apiKey: z.string().min(1),
      baseUrl: z.string().url().optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");
    const owner = c.get("owner") as Owner;

    const encrypted = encryptApiKey(body.apiKey);

    const [inserted] = await db
      .insert(providerKeys)
      .values({
        userId: owner.id,
        provider: body.provider,
        label: body.label,
        encryptedKey: encrypted.ciphertext,
        encryptionIv: encrypted.iv,
        encryptionAuthTag: encrypted.authTag,
        baseUrl: body.baseUrl ?? null,
        isActive: true,
      })
      .returning({
        id: providerKeys.id,
        provider: providerKeys.provider,
        label: providerKeys.label,
        createdAt: providerKeys.createdAt,
      });

    return c.json(inserted, 201);
  },
);

setupRouter.get("/provider-keys", async (c) => {
  const owner = c.get("owner") as Owner;

  const condition = owner.id
    ? and(eq(providerKeys.userId, owner.id), eq(providerKeys.isActive, true))
    : and(isNull(providerKeys.userId), eq(providerKeys.isActive, true));

  const keys = await db
    .select({
      id: providerKeys.id,
      provider: providerKeys.provider,
      label: providerKeys.label,
      isActive: providerKeys.isActive,
      lastUsedAt: providerKeys.lastUsedAt,
    })
    .from(providerKeys)
    .where(condition);

  return c.json(keys);
});

setupRouter.delete("/provider-key/:id", async (c) => {
  const owner = c.get("owner") as Owner;
  const id = c.req.param("id");

  const condition = owner.id
    ? and(eq(providerKeys.id, id), eq(providerKeys.userId, owner.id))
    : and(eq(providerKeys.id, id), isNull(providerKeys.userId));

  await db.update(providerKeys).set({ isActive: false, updatedAt: new Date() }).where(condition);

  return c.json({ ok: true });
});

setupRouter.post(
  "/test-connection",
  zValidator(
    "json",
    z.object({
      provider: z.enum(PROVIDERS),
      apiKey: z.string().min(1),
      baseUrl: z.string().url().optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");
    const start = Date.now();

    try {
      let ok = false;
      let errorMsg: string | undefined;

      if (body.provider === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": body.apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 10,
            messages: [{ role: "user", content: "Reply with the single word OK" }],
          }),
        });
        ok = res.ok;
        if (!ok) {
          const err = await res.json().catch(() => ({}));
          errorMsg =
            (err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
        }
      } else if (body.provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${body.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 10,
            messages: [{ role: "user", content: "Reply with the single word OK" }],
          }),
        });
        ok = res.ok;
        if (!ok) {
          const err = await res.json().catch(() => ({}));
          errorMsg =
            (err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
        }
      } else if (body.provider === "groq") {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${body.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            max_tokens: 10,
            messages: [{ role: "user", content: "Reply with the single word OK" }],
          }),
        });
        ok = res.ok;
        if (!ok) {
          const err = await res.json().catch(() => ({}));
          errorMsg =
            (err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
        }
      } else if (body.provider === "google") {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${body.apiKey}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Reply with the single word OK" }] }],
            }),
          },
        );
        ok = res.ok;
        if (!ok) {
          const err = await res.json().catch(() => ({}));
          errorMsg = JSON.stringify((err as Record<string, unknown>).error ?? `HTTP ${res.status}`);
        }
      } else if (body.provider === "ollama" || body.provider === "custom") {
        const base = body.baseUrl ?? "http://localhost:11434";
        const res = await fetch(`${base}/api/generate`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model: "llama3",
            prompt: "Reply with the single word OK",
            stream: false,
          }),
        });
        ok = res.ok;
        if (!ok) errorMsg = `HTTP ${res.status}`;
      }

      return c.json({ ok, latencyMs: Date.now() - start, error: errorMsg });
    } catch (err) {
      return c.json({
        ok: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

setupRouter.post("/complete", async (c) => {
  await db
    .insert(instanceConfig)
    .values({ key: "setup_completed", value: true, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: instanceConfig.key,
      set: { value: true, updatedAt: new Date() },
    });
  return c.json({ ok: true });
});
