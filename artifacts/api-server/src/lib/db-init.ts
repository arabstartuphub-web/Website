import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";
import { runDailyFetch } from "./news-scraper";
import { articlesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";

const DEFAULT_CATEGORIES = [
  { name: "Funding",                    slug: "funding",                   description: "Venture capital, seed rounds, and investment news",                           articleCount: 0 },
  { name: "Launches",                   slug: "launches",                  description: "New product and startup launches across the GCC",                             articleCount: 0 },
  { name: "Acquisitions",               slug: "acquisitions",              description: "M&A activity in the Arabian startup ecosystem",                               articleCount: 0 },
  { name: "Ecosystem",                  slug: "ecosystem",                 description: "Events, accelerators, and ecosystem development",                             articleCount: 0 },
  { name: "People",                     slug: "people",                    description: "Leadership changes, founders, and key hires",                                 articleCount: 0 },
  { name: "Policy",                     slug: "policy",                    description: "Regulatory updates and government initiatives",                               articleCount: 0 },
  { name: "Growth",                     slug: "growth",                    description: "Expansion news and market milestones",                                        articleCount: 0 },
  { name: "Technology",                 slug: "technology",                description: "Tech innovation and digital transformation",                                  articleCount: 0 },
  { name: "Incubators & Accelerators",  slug: "incubators-accelerators",   description: "GCC incubators, accelerators, startup studios, and entrepreneurship programs", articleCount: 0 },
];

interface SeedArticle {
  title: string; summary: string; sourceUrl: string; sourceName: string;
  category: string; country: string; tags: string[]; isFeatured: boolean; publishedAt: string;
}

function loadSeedArticles(): SeedArticle[] {
  try {
    const seedPath = resolve(import.meta.dirname, "../seed/articles.json");
    const raw = readFileSync(seedPath, "utf-8");
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [];
  } catch { return []; }
}

async function seedArticlesFromFile(): Promise<number> {
  const seedArticles = loadSeedArticles();
  if (seedArticles.length === 0) return 0;
  let inserted = 0;
  for (const article of seedArticles) {
    try {
      const existing = await db.select({ id: articlesTable.id }).from(articlesTable).where(eq(articlesTable.sourceUrl, article.sourceUrl)).limit(1);
      if (existing.length > 0) continue;
      await db.insert(articlesTable).values({
        title: article.title.slice(0, 500),
        summary: (article.summary || article.title).slice(0, 1000),
        sourceUrl: article.sourceUrl, sourceName: article.sourceName,
        category: article.category, country: article.country,
        tags: article.tags || [], isFeatured: article.isFeatured ?? false,
        viewCount: 0, publishedAt: new Date(article.publishedAt),
      });
      inserted++;
    } catch (err) { logger.warn({ err, title: article.title }, "Failed to insert seed article"); }
  }
  logger.info({ inserted, total: seedArticles.length }, "Seeded articles from file");
  return inserted;
}

export async function initializeDatabase(): Promise<{ categories: number; articles: number }> {
  logger.info("Initializing database...");

  // ── Ensure fetch_runs table exists (created here because Render free tier
  //    has no shell for migrations — same pattern as categories below) ─────────
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fetch_runs (
        id               SERIAL PRIMARY KEY,
        started_at       TIMESTAMP NOT NULL,
        finished_at      TIMESTAMP,
        success          BOOLEAN NOT NULL DEFAULT FALSE,
        articles_inserted INTEGER NOT NULL DEFAULT 0,
        feed_stats       JSON DEFAULT '{}',
        error            TEXT,
        created_at       TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  } catch (err) { logger.warn({ err }, "fetch_runs table check failed"); }

  // Ensure categories exist
  let insertedCategories = 0;
  try {
    const count = await db.execute(sql`SELECT COUNT(*) FROM categories`);
    const existing = Number(count?.[0]?.count ?? 0);
    if (existing === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        try {
          await db.execute(sql`
            INSERT INTO categories (name, slug, description, article_count)
            VALUES (${cat.name}, ${cat.slug}, ${cat.description}, ${cat.articleCount})
            ON CONFLICT (slug) DO NOTHING
          `);
          insertedCategories++;
        } catch (err) { logger.warn({ err, category: cat.slug }, "Failed to insert category"); }
      }
      logger.info({ insertedCategories }, "Categories seeded");
    }
  } catch (err) { logger.warn({ err }, "Categories check failed"); }

  // Always try to fetch fresh articles via RSS
  let articlesCount = 0;
  try {
    const before = await db.execute(sql`SELECT COUNT(*) FROM articles`);
    const countBefore = Number(before?.[0]?.count ?? 0);

    if (countBefore < 10) {
      // Empty DB — seed from file first for immediate content
      logger.info("Empty DB — seeding from file then fetching live");
      await seedArticlesFromFile();
    }

    // Always run live fetch — returns number of newly inserted articles
    logger.info("Running live RSS fetch...");
    articlesCount = await runDailyFetch();
    logger.info({ articlesCount }, "Init complete");
  } catch (err) { logger.error({ err }, "Failed to populate articles"); }

  return { categories: insertedCategories, articles: articlesCount };
}
