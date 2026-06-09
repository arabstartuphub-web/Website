import app from "./app";
import { logger } from "./lib/logger";
import { startScheduler } from "./lib/scheduler";
import { runDailyFetch } from "./lib/news-scraper";
import { initializeDatabase } from "./lib/db-init";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Initialize database on startup (creates tables, seeds categories, fetches news)
  // This is the workaround for Render free tier which has no shell access.
  initializeDatabase()
    .then((result) => {
      logger.info(
        { categories: result.categories, articles: result.articles },
        "Database initialization complete"
      );
    })
    .catch((err) => {
      logger.error({ err }, "Database initialization failed");
    })
    .finally(() => {
      // Start the daily news scheduler regardless of init result
      startScheduler();
    });
});
