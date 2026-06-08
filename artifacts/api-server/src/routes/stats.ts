import { Router } from "express";
import { db, articlesTable } from "@workspace/db";
import { sql, desc, gte } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const [totalResult, todayResult, weekResult, byCountry, byCategory, fundingResult] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(articlesTable),
        db
          .select({ count: sql<number>`count(*)` })
          .from(articlesTable)
          .where(gte(articlesTable.publishedAt, today)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(articlesTable)
          .where(gte(articlesTable.publishedAt, weekAgo)),
        db
          .select({
            country: articlesTable.country,
            count: sql<number>`count(*)`,
          })
          .from(articlesTable)
          .groupBy(articlesTable.country)
          .orderBy(desc(sql`count(*)`)),
        db
          .select({
            category: articlesTable.category,
            count: sql<number>`count(*)`,
          })
          .from(articlesTable)
          .groupBy(articlesTable.category)
          .orderBy(desc(sql`count(*)`)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(articlesTable)
          .where(sql`category = 'Funding'`),
      ]);

    const countryMeta: Record<string, { code: string; flag: string }> = {
      "Saudi Arabia": { code: "SA", flag: "🇸🇦" },
      UAE: { code: "AE", flag: "🇦🇪" },
      Kuwait: { code: "KW", flag: "🇰🇼" },
      Qatar: { code: "QA", flag: "🇶🇦" },
      Bahrain: { code: "BH", flag: "🇧🇭" },
      Oman: { code: "OM", flag: "🇴🇲" },
    };

    res.json({
      totalArticles: Number(totalResult[0]?.count ?? 0),
      totalFundingMentions: Number(fundingResult[0]?.count ?? 0),
      articlesByCountry: byCountry.map((r) => ({
        country: r.country,
        code: countryMeta[r.country]?.code ?? "??",
        flag: countryMeta[r.country]?.flag ?? "🏳",
        articleCount: Number(r.count),
      })),
      articlesByCategory: byCategory.map((r) => ({
        category: r.category,
        count: Number(r.count),
      })),
      todayCount: Number(todayResult[0]?.count ?? 0),
      weekCount: Number(weekResult[0]?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
