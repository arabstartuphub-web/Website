import { Router } from "express";
import { initializeDatabase } from "../lib/db-init";

const router = Router();

/**
 * POST /api/init
 * Triggers database initialization: creates tables, seeds categories, and runs the news fetch.
 * Safe to call multiple times — it skips already-existing data.
 * This is the workaround for Render free tier which doesn't have a shell.
 */
router.post("/init", async (req, res) => {
  try {
    const result = await initializeDatabase();
    res.json({
      success: true,
      message: "Database initialized successfully",
      categoriesSeeded: result.categories,
      articlesFetched: result.articles,
    });
  } catch (err) {
    req.log.error({ err }, "Database initialization failed");
    res.status(500).json({
      success: false,
      error: "Database initialization failed. Check that DATABASE_URL is set correctly.",
    });
  }
});

/**
 * GET /api/init
 * Returns the current database status without modifying anything.
 */
router.get("/init", async (req, res) => {
  try {
    const { db } = await import("@workspace/db");
    const { sql } = await import("drizzle-orm");

    const categories = await db.execute(sql`SELECT COUNT(*) FROM categories`).catch(() => [{ count: 0 }]);
    const articles = await db.execute(sql`SELECT COUNT(*) FROM articles`).catch(() => [{ count: 0 }]);
    const digests = await db.execute(sql`SELECT COUNT(*) FROM digests`).catch(() => [{ count: 0 }]);
    const subscribers = await db.execute(sql`SELECT COUNT(*) FROM newsletter_subscribers`).catch(() => [{ count: 0 }]);

    res.json({
      initialized: Number(categories[0]?.count ?? 0) > 0,
      categories: Number(categories[0]?.count ?? 0),
      articles: Number(articles[0]?.count ?? 0),
      digests: Number(digests[0]?.count ?? 0),
      newsletterSubscribers: Number(subscribers[0]?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Database status check failed");
    res.status(500).json({
      initialized: false,
      error: "Database is not accessible. Check DATABASE_URL.",
    });
  }
});

export default router;
