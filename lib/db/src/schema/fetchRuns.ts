import { pgTable, serial, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Per-feed result captured for each fetch run, keyed by source name in the
// `feedStats` JSON column, e.g. { "Wamda": { inserted: 3, error: null }, ... }
export interface FeedRunStat {
  inserted: number;
  error: string | null;
}

export const fetchRunsTable = pgTable("fetch_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  success: boolean("success").default(false).notNull(),
  articlesInserted: integer("articles_inserted").default(0).notNull(),
  feedStats: json("feed_stats").$type<Record<string, FeedRunStat>>().default({}),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFetchRunSchema = createInsertSchema(fetchRunsTable).omit({ id: true, createdAt: true });
export type InsertFetchRun = z.infer<typeof insertFetchRunSchema>;
export type FetchRun = typeof fetchRunsTable.$inferSelect;
