import { pgTable, serial, text, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const digestsTable = pgTable("digests", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  summary: text("summary").notNull(),
  highlights: json("highlights").$type<string[]>().default([]),
  articleCount: integer("article_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDigestSchema = createInsertSchema(digestsTable).omit({ id: true, createdAt: true });
export type InsertDigest = z.infer<typeof insertDigestSchema>;
export type Digest = typeof digestsTable.$inferSelect;
