import { createId } from "@paralleldrive/cuid2";
import {
  customType,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { personas } from "./personas";

const vector = (name: string, dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]) {
      return `[${value.join(",")}]`;
    },
    fromDriver(value: string) {
      return value.slice(1, -1).split(",").map(Number);
    },
  })(name);

export const debates = pgTable("debates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  resolution: text("resolution").notNull(),
  framingNotes: text("framing_notes"),
  format: text("format").default("oxford_lite").notNull(),
  country: text("country").default("global").notNull(),
  status: text("status").default("pending").notNull(),
  embedding: vector("embedding", 1536),
  createdById: text("created_by_id").references(() => users.id, { onDelete: "set null" }),
  totalCost: real("total_cost").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
});

export const debatePersonas = pgTable(
  "debate_personas",
  {
    debateId: text("debate_id")
      .notNull()
      .references(() => debates.id, { onDelete: "cascade" }),
    personaId: text("persona_id")
      .notNull()
      .references(() => personas.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
  },
  (table) => [primaryKey({ columns: [table.debateId, table.personaId] })],
);

export const debateTurns = pgTable("debate_turns", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  debateId: text("debate_id")
    .notNull()
    .references(() => debates.id, { onDelete: "cascade" }),
  personaId: text("persona_id").references(() => personas.id, { onDelete: "set null" }),
  phase: text("phase", {
    enum: ["framing", "opening", "cross_examination", "rebuttal", "closing", "synthesis"],
  }).notNull(),
  role: text("role", { enum: ["moderator", "debater", "synthesizer"] }).notNull(),
  content: text("content").notNull(),
  turnOrder: integer("turn_order").notNull(),
  tokenCount: integer("token_count").default(0).notNull(),
  modelUsed: text("model_used"),
  costUsd: real("cost_usd").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const factChecks = pgTable("fact_checks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  debateId: text("debate_id")
    .notNull()
    .references(() => debates.id, { onDelete: "cascade" }),
  turnId: text("turn_id")
    .notNull()
    .references(() => debateTurns.id, { onDelete: "cascade" }),
  claim: text("claim").notNull(),
  verdict: text("verdict", {
    enum: ["supported", "contested", "unverified", "false"],
  }).notNull(),
  confidence: real("confidence").notNull(),
  sources: jsonb("sources").notNull(),
  reasoning: text("reasoning").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Debate = typeof debates.$inferSelect;
export type NewDebate = typeof debates.$inferInsert;
export type DebatePersona = typeof debatePersonas.$inferSelect;
export type NewDebatePersona = typeof debatePersonas.$inferInsert;
export type DebateTurn = typeof debateTurns.$inferSelect;
export type NewDebateTurn = typeof debateTurns.$inferInsert;
export type FactCheck = typeof factChecks.$inferSelect;
export type NewFactCheck = typeof factChecks.$inferInsert;
