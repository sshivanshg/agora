import { createId } from "@paralleldrive/cuid2";
import { bigint, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { debates } from "./debates";

export const streamEvents = pgTable(
  "stream_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    debateId: text("debate_id")
      .notNull()
      .references(() => debates.id, { onDelete: "cascade" }),
    seqNo: bigint("seq_no", { mode: "number" }).notNull(),
    event: jsonb("event").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("stream_events_debate_seq_idx").on(table.debateId, table.seqNo)],
);

export type StreamEvent = typeof streamEvents.$inferSelect;
export type NewStreamEvent = typeof streamEvents.$inferInsert;
