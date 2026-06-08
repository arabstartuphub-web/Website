# Arabian Startups Ecosystem

A daily auto-curated news digest for startup and tech news from Saudi Arabia and GCC countries (UAE, Kuwait, Qatar, Bahrain, Oman).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + node-cron (daily RSS feed scheduler) + rss-parser
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind + framer-motion + wouter
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB tables: articles, categories, digests, newsletter_subscribers
- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `artifacts/api-server/src/lib/news-scraper.ts` — RSS feed fetcher + GCC keyword detection
- `artifacts/api-server/src/lib/scheduler.ts` — cron job (daily at 07:00 AST / 04:00 UTC)
- `artifacts/arabian-startups/src/` — React frontend
- `render.yaml` — Render.com deployment configuration

## News Automation

On every server startup, and daily at 07:00 Saudi Arabia time (UTC+3), the scheduler:
1. Fetches RSS feeds from GCC-focused news sources (TechCrunch MENA, Entrepreneur ME, and others)
2. Filters articles that mention GCC countries/cities using keyword detection
3. Auto-classifies each article by country and category (Funding, Launches, Acquisitions, etc.)
4. Deduplicates by source URL
5. Auto-generates a daily digest summary with highlights

To add more RSS feeds, edit `FEEDS` in `artifacts/api-server/src/lib/news-scraper.ts`.

## Deploying to Render (Free Tier)

### Step 1 — Push to GitHub

1. Create a new **private** or public repository on [github.com](https://github.com/new)
2. In a terminal (or Replit Shell), run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step 2 — Deploy on Render

1. Go to [render.com](https://render.com) and sign up / log in
2. Click **New → Blueprint** and connect your GitHub repository
3. Render will detect `render.yaml` automatically and create:
   - **arabian-startups-api** — Express API server
   - **arabian-startups-web** — React static site
   - **arabian-startups-db** — Free PostgreSQL database
4. After deploy, open the API service settings and set:
   - `DATABASE_URL` → copy the Internal Database URL from the DB service
5. The API will run DB migrations automatically on first boot (`pnpm --filter @workspace/db run push`)

### Step 3 — Connect frontend to API

In the static web service settings on Render, add a **Redirect/Rewrite** rule:
- Source: `/api/*`
- Destination: `https://arabian-startups-api.onrender.com/api/$1`
- Action: Rewrite

### Notes
- Free Render services spin down after 15 min of inactivity — first request after idle may be slow (~30s)
- The free PostgreSQL database expires after 90 days on Render's free plan — upgrade or recreate as needed

## User preferences

- LinkedIn: https://www.linkedin.com/company/arabian-startups-ecosystem
- No Twitter link in footer
- Logo: `artifacts/arabian-startups/src/assets/logo.jpg`

## Gotchas

- After any schema change: run `pnpm --filter @workspace/db run push` then restart the API workflow
- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs`
- The `@assets` Vite alias points to `attached_assets/` (workspace root) — for local copies use `@/assets/` instead
- Many news sites (Magnitt, Zawya, Arab News) block RSS scrapers with 403 — this is handled gracefully; working feeds continue unaffected
