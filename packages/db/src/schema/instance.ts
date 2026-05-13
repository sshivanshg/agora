import { createId } from "@paralleldrive/cuid2";
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const instanceConfig = pgTable("instance_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const providerKeys = pgTable(
  "provider_keys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    provider: text("provider", {
      enum: ["anthropic", "openai", "google", "groq", "ollama", "custom"],
    }).notNull(),
    label: text("label").notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    encryptionIv: text("encryption_iv").notNull(),
    encryptionAuthTag: text("encryption_auth_tag").notNull(),
    baseUrl: text("base_url"),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("provider_keys_user_provider_active_idx").on(
      table.userId,
      table.provider,
      table.isActive,
    ),
  ],
);

export type InstanceConfig = typeof instanceConfig.$inferSelect;
export type NewInstanceConfig = typeof instanceConfig.$inferInsert;
export type ProviderKey = typeof providerKeys.$inferSelect;
export type NewProviderKey = typeof providerKeys.$inferInsert;
