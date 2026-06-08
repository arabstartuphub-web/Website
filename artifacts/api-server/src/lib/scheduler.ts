import cron from "node-cron";
import { runDailyFetch } from "./news-scraper";
import { logger } from "./logger";

export function startScheduler(): void {
  // Run at 07:00 Saudi Arabia time (UTC+3) = 04:00 UTC every day
  cron.schedule(
    "0 4 * * *",
    async () => {
      logger.info("Cron triggered: daily news fetch");
      try {
        await runDailyFetch();
      } catch (err) {
        logger.error({ err }, "Cron job failed");
      }
    },
    { timezone: "UTC" }
  );

  logger.info("Scheduler started — daily fetch at 07:00 AST (04:00 UTC)");
}
