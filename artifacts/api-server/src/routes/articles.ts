import { Router } from "express";
import { db, articlesTable } from "@workspace/db";
import { eq, desc, ilike, and, sql, or } from "drizzle-orm";

const router = Router();

router.get("/articles", async (req, res) => {
  try {
    const page = parseInt(String(req.query.page ?? "1"), 10);
    const limit = parseInt(String(req.query.limit ?? "20"), 10);
    const category = req.query.category as string | undefined;
    const country = req.query.country as string | undefined;
    const search = req.query.search as string | undefined;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (category) conditions.push(eq(articlesTable.category, category));
    if (country) conditions.push(eq(articlesTable.country, country));
    if (search) {
      conditions.push(
        or(
          ilike(articlesTable.title, `%${search}%`),
          ilike(articlesTable.summary, `%${search}%`)
        )!
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [articles, countResult] = await Promise.all([
      db
        .select()
        .from(articlesTable)
        .where(where)
        .orderBy(desc(articlesTable.publishedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(articlesTable).where(where),
    ]);

    res.json({
      articles,
      total: Number(countResult[0]?.count ?? 0),
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list articles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/articles/featured", async (req, res) => {
  try {
    // Top Story should always reflect the freshest relevant news.
    // `isFeatured` is a manual pin — but a pin should never outrank fresh
    // news for more than 48h, otherwise old seeded articles get stuck
    // at the top forever. So: order by recency first, and within the
    // last 48h give a slight boost to isFeatured articles as a tiebreaker.
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    const articles = await db
      .select()
      .from(articlesTable)
      .orderBy(
        desc(sql`(${articlesTable.isFeatured} AND ${articlesTable.publishedAt} >= ${cutoff.toISOString()})`),
        desc(articlesTable.publishedAt)
      )
      .limit(5);

    res.json(articles);
  } catch (err) {
    req.log.error({ err }, "Failed to get featured articles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/articles/trending", async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit ?? "5"), 10);
    const articles = await db
      .select()
      .from(articlesTable)
      .orderBy(desc(articlesTable.viewCount))
      .limit(limit);
    res.json(articles);
  } catch (err) {
    req.log.error({ err }, "Failed to get trending articles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/articles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [article] = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.id, id))
      .limit(1);
    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    // Increment view count
    await db
      .update(articlesTable)
      .set({ viewCount: article.viewCount + 1 })
      .where(eq(articlesTable.id, id));
    res.json({ ...article, viewCount: article.viewCount + 1 });
  } catch (err) {
    req.log.error({ err }, "Failed to get article");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/countries", async (req, res) => {
  try {
    const rows = await db
      .select({
        country: articlesTable.country,
        count: sql<number>`count(*)`,
      })
      .from(articlesTable)
      .groupBy(articlesTable.country)
      .orderBy(desc(sql`count(*)`));

    const countryMeta: Record<string, { code: string; flag: string }> = {
      "Saudi Arabia": { code: "SA", flag: "🇸🇦" },
      UAE: { code: "AE", flag: "🇦🇪" },
      Kuwait: { code: "KW", flag: "🇰🇼" },
      Qatar: { code: "QA", flag: "🇶🇦" },
      Bahrain: { code: "BH", flag: "🇧🇭" },
      Oman: { code: "OM", flag: "🇴🇲" },
    };

    const result = rows.map((r) => ({
      country: r.country,
      code: countryMeta[r.country]?.code ?? r.country.slice(0, 2).toUpperCase(),
      flag: countryMeta[r.country]?.flag ?? "🏳",
      articleCount: Number(r.count),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list countries");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
