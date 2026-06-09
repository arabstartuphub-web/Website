import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";
import { runDailyFetch } from "./news-scraper";
import { articlesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";

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

interface SeedArticle {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  category: string;
  country: string;
  tags: string[];
  isFeatured: boolean;
  publishedAt: string;
}

function loadSeedArticles(): SeedArticle[] {
  try {
    const seedPath = resolve(import.meta.dirname, "../seed/articles.json");
    const raw = readFileSync(seedPath, "utf-8");
    const json = JSON.parse(raw);
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    return [];
  }
}

async function seedArticlesFromFile(): Promise<number> {
  const seedArticles = loadSeedArticles();
  if (seedArticles.length === 0) {
    logger.info("No seed articles found in file");
    return 0;
  }

  let inserted = 0;
  for (const article of seedArticles) {
    try {
      const existing = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(eq(articlesTable.sourceUrl, article.sourceUrl))
        .limit(1);

      if (existing.length > 0) continue;

      await db.insert(articlesTable).values({
        title: article.title.slice(0, 500),
        summary: (article.summary || article.title).slice(0, 1000),
        sourceUrl: article.sourceUrl,
        sourceName: article.sourceName,
        category: article.category,
        country: article.country,
        tags: article.tags || [],
        isFeatured: article.isFeatured ?? false,
        viewCount: 0,
        publishedAt: new Date(article.publishedAt),
      });
      inserted++;
    } catch (err) {
      logger.warn({ err, title: article.title }, "Failed to insert seed article");
    }
  }

  logger.info({ inserted, total: seedArticles.length }, "Seeded articles from file");
  return inserted;
}

/**
 * Initialize the database:
 * 1. Ensure tables exist
 * 2. Seed default categories if none exist
 * 3. Seed articles from seed file (or fetch via RSS as fallback)
 */
export async function initializeDatabase(): Promise<{ categories: number; articles: number }> {
  logger.info("Initializing database...");

  // Check if categories table exists
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

  // Populate articles
  let articlesCount = 0;
  try {
    const articlesResult = await db.execute(sql`SELECT COUNT(*) FROM articles`);
    const existingArticles = articlesResult?.[0]?.count ?? 0;

    if (existingArticles < 10) {
      logger.info("Database has fewer than 10 articles — seeding from file");
      const seeded = await seedArticlesFromFile();
      if (seeded > 0) {
        const newCount = await db.execute(sql`SELECT COUNT(*) FROM articles`);
        articlesCount = newCount?.[0]?.count ?? 0;
      } else {
        logger.info("No seed file available — trying RSS fetch as fallback");
        await runDailyFetch();
        const newCount = await db.execute(sql`SELECT COUNT(*) FROM articles`);
        articlesCount = newCount?.[0]?.count ?? 0;
      }
    } else {
      articlesCount = existingArticles;
      logger.info({ articlesCount }, "Articles already populated");
    }
  } catch (err) {
    logger.error({ err }, "Failed to populate articles");
  }

  return { categories: insertedCategories, articles: articlesCount };
}
