import { Router } from "express";
import { db, fetchRunsTable, type FeedRunStat } from "@workspace/db";
import { desc, gte } from "drizzle-orm";

const router = Router();

/**
 * GET /api/status
 * Reports whether the news fetcher is healthy: when it last ran, whether it
 * succeeded, how many articles it inserted, and which feeds have produced
 * nothing for the last 7 days (likely dead/blocked feeds).
 *
 * Used by the daily-fetch GitHub Actions workflow to fail loudly instead of
 * only checking the immediate /api/init response.
 */
router.get("/status", async (req, res) => {
  try {
    const [lastRun] = await db
      .select()
      .from(fetchRunsTable)
      .orderBy(desc(fetchRunsTable.startedAt))
      .limit(1);

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const recentRuns = await db
      .select({ feedStats: fetchRunsTable.feedStats })
      .from(fetchRunsTable)
      .where(gte(fetchRunsTable.startedAt, since));

    const totals: Record<string, { inserted: number; errors: number }> = {};
    for (const run of recentRuns) {
      for (const [feedName, stat] of Object.entries(run.feedStats ?? {}) as [string, FeedRunStat][]) {
        if (!totals[feedName]) totals[feedName] = { inserted: 0, errors: 0 };
        totals[feedName]!.inserted += stat.inserted;
        if (stat.error) totals[feedName]!.errors += 1;
      }
    }
    const deadFeeds = Object.entries(totals)
      .filter(([, t]) => t.inserted === 0)
      .map(([feed]) => feed);

    if (!lastRun) {
      res.json({
        lastFetchAt: null,
        lastFetchSuccess: null,
        lastFetchTotal: null,
        deadFeeds,
        message: "No fetch runs recorded yet",
      });
      return;
    }

    res.json({
      lastFetchAt: lastRun.finishedAt ?? lastRun.startedAt,
      lastFetchSuccess: lastRun.success,
      lastFetchTotal: lastRun.articlesInserted,
      lastFetchError: lastRun.error,
      deadFeeds,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
