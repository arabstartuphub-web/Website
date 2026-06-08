import { Router } from "express";
import { db, digestsTable, articlesTable } from "@workspace/db";
import { desc, eq, and, sql, gte } from "drizzle-orm";

const router = Router();

router.get("/digest/latest", async (req, res) => {
  try {
    const [digest] = await db
      .select()
      .from(digestsTable)
      .orderBy(desc(digestsTable.date))
      .limit(1);

    if (!digest) {
      return res.status(404).json({ error: "No digest available yet" });
    }

    // Get today's articles
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const articles = await db
      .select()
      .from(articlesTable)
      .where(gte(articlesTable.publishedAt, today))
      .orderBy(desc(articlesTable.publishedAt))
      .limit(20);

    res.json({ ...digest, articles });
  } catch (err) {
    req.log.error({ err }, "Failed to get latest digest");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/digest", async (req, res) => {
  try {
    const page = parseInt(String(req.query.page ?? "1"), 10);
    const limit = parseInt(String(req.query.limit ?? "10"), 10);
    const offset = (page - 1) * limit;

    const [digests, countResult] = await Promise.all([
      db
        .select()
        .from(digestsTable)
        .orderBy(desc(digestsTable.date))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(digestsTable),
    ]);

    res.json({
      digests: digests.map((d) => ({ ...d, articles: [] })),
      total: Number(countResult[0]?.count ?? 0),
      page,
      limit,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list digests");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
