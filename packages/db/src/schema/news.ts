import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { debates } from "./debates";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string) {
    return value.slice(1, -1).split(",").map(Number);
  },
});

export const articles = pgTable(
  "articles",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id"),
    providerName: text("provider_name").notNull(),
    country: text("country").notNull(),
    countryBucket: text("country_bucket").notNull(),
    sourceName: text("source_name").notNull(),
    sourceDomain: text("source_domain").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url").notNull().unique(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    language: text("language").notNull(),
    themes: text("themes").array(),
    embedding: vector("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("articles_bucket_published_idx").on(t.countryBucket, t.publishedAt),
    index("articles_created_idx").on(t.createdAt),
  ],
);

export const clusters = pgTable(
  "clusters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    countryBucket: text("country_bucket").notNull(),
    centroidEmbedding: vector("centroid_embedding"),
    representativeTitle: text("representative_title").notNull(),
    articleCount: integer("article_count").default(1).notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).defaultNow().notNull(),
    trendingScore: real("trending_score").default(0).notNull(),
    isDebatable: boolean("is_debatable"),
    rejectionReason: text("rejection_reason"),
    resolution: text("resolution"),
    framingNotes: text("framing_notes"),
    framedAt: timestamp("framed_at", { withTimezone: true }),
    debateId: text("debate_id").references(() => debates.id, { onDelete: "set null" }),
  },
  (t) => [index("clusters_bucket_score_idx").on(t.countryBucket, t.trendingScore)],
);

export const clusterArticles = pgTable(
  "cluster_articles",
  {
    clusterId: text("cluster_id")
      .notNull()
      .references(() => clusters.id, { onDelete: "cascade" }),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    similarity: real("similarity").notNull(),
  },
  (t) => [primaryKey({ columns: [t.clusterId, t.articleId] })],
);

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Cluster = typeof clusters.$inferSelect;
export type NewCluster = typeof clusters.$inferInsert;
export type ClusterArticle = typeof clusterArticles.$inferSelect;
export type NewClusterArticle = typeof clusterArticles.$inferInsert;
