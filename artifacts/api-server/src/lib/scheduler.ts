import cron from "node-cron";
import { runDailyFetch } from "./news-scraper";
import { logger } from "./logger";

export function startScheduler(): void {
  // Run every 6 hours so news stays fresh even if one cycle is missed
  // 00:00, 06:00, 12:00, 18:00 UTC = 03:00, 09:00, 15:00, 21:00 AST
  cron.schedule(
    "0 */6 * * *",
    async () => {
      logger.info("Cron triggered: news fetch");
      try {
        await runDailyFetch();
      } catch (err) {
        logger.error({ err }, "Cron job failed");
      }
    },
    { timezone: "UTC" }
  );

  logger.info("Scheduler started — news fetch every 6 hours");

  // Also run immediately on startup to fetch any news missed while server was down
  setTimeout(async () => {
    logger.info("Startup fetch: catching up on missed news");
    try {
      await runDailyFetch();
    } catch (err) {
      logger.error({ err }, "Startup fetch failed");
    }
  }, 10000); // 10 seconds after startup to let DB settle
}
