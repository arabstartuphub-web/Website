import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";
import { runDailyFetch } from "./news-scraper";

const DEFAULT_CATEGORIES = [
  { name: "Funding", slug: "funding", description: "Venture capital, seed rounds, and investment news", articleCount: 0 },
  { name: "Launches", slug: "launches", description: "New product and startup launches across the GCC", articleCount: 0 },
  { name: "Acquisitions", slug: "acquisitions", description: "M&A activity in the Arabian startup ecosystem", articleCount: 0 },
  { name: "Ecosystem", slug: "ecosystem", description: "Events, accelerators, and ecosystem development", articleCount: 0 },
  { name: "People", slug: "people", description: "Leadership changes, founders, and key hires", articleCount: 0 },
  { name: "Policy", slug: "policy", description: "Regulatory updates and government initiatives", articleCount: 0 },
  { name: "Growth", slug: "growth", description: "Expansion news and market milestones", articleCount: 0 },
  { name: "Technology", slug: "technology", description: "Tech innovation and digital transformation", articleCount: 0 },
  { name: "Incubators & Accelerators", slug: "incubators-accelerators", description: "News from GCC incubators, accelerators, startup studios, and entrepreneurship programs", articleCount: 0 },
];

/**
 * Initialize the database:
 * 1. Ensure tables exist (if they don't, the drizzle push will be done via the build command)
 * 2. Seed default categories if none exist
 * 3. Run the daily news fetch to populate articles
 */
export async function initializeDatabase(): Promise<{ categories: number; articles: number }> {
  logger.info("Initializing database...");

  // Check if categories table exists by trying to count
  let hasCategories = false;
  try {
    const count = await db.execute(sql`SELECT COUNT(*) FROM categories`);
    if (count && count.length > 0) {
      hasCategories = true;
    }
  } catch {
    logger.warn("Categories table not found — database may not be initialized");
  }

  let insertedCategories = 0;

  if (!hasCategories) {
    // Seed categories
    for (const cat of DEFAULT_CATEGORIES) {
      try {
        await db.execute(sql`
          INSERT INTO categories (name, slug, description, article_count)
          VALUES (${cat.name}, ${cat.slug}, ${cat.description}, ${cat.articleCount})
          ON CONFLICT (slug) DO NOTHING
        `);
        insertedCategories++;
      } catch (err) {
        logger.warn({ err, category: cat.slug }, "Failed to insert category");
      }
    }
    logger.info({ insertedCategories }, "Categories seeded");
  } else {
    logger.info("Categories already exist, skipping seed");
  }

  // Run news fetch to populate articles
  let articlesCount = 0;
  try {
    // First, check if we already have articles
    const articlesResult = await db.execute(sql`SELECT COUNT(*) FROM articles`);
    const existingArticles = articlesResult?.[0]?.count ?? 0;

    if (existingArticles < 10) {
      logger.info("Running initial news fetch to populate articles");
      await runDailyFetch();
      const newCount = await db.execute(sql`SELECT COUNT(*) FROM articles`);
      articlesCount = newCount?.[0]?.count ?? 0;
    } else {
      articlesCount = existingArticles;
      logger.info({ articlesCount }, "Articles already populated");
    }
  } catch (err) {
    logger.error({ err }, "Failed to run initial news fetch");
  }

  return { categories: insertedCategories, articles: articlesCount };
}
