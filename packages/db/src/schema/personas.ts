import { createId } from "@paralleldrive/cuid2";
import { boolean, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const personas = pgTable("personas", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  worldviewTag: text("worldview_tag").notNull(),
  specContent: text("spec_content").notNull(),
  specHash: text("spec_hash").notNull(),
  modelPreference: text("model_preference"),
  temperature: real("temperature").default(0.7).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
