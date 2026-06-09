# Deploying Arabian Startups Ecosystem on Render (Free Tier)

## You will need TWO services on Render

### Prerequisites
1. Your code is pushed to GitHub: `https://github.com/arabstartuphub-web/Website`
2. You have a Neon.tech PostgreSQL connection string (already set up)

---

## Step 1: Create the API Service

1. Go to [render.com](https://render.com) Dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repo: `arabstartuphub-web/Website`
4. Configure:
   - **Name**: `arabian-startups-api`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     corepack enable && pnpm install && pnpm --filter @workspace/db run push && pnpm --filter @workspace/api-server run build
     ```
   - **Start Command**:
     ```bash
     node artifacts/api-server/dist/index.mjs
     ```
   - **Health Check Path**: `/api/healthz`
5. Set Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `BASE_PATH` = `/api`
   - `DATABASE_URL` = `<your Neon connection string>`
6. Click **Create Web Service**

---

## Step 2: Create the Frontend Static Site

1. In Render Dashboard, click **New +** → **Static Site**
2. Connect the same GitHub repo
3. Configure:
   - **Name**: `arabian-startups-web`
   - **Build Command**:
     ```bash
     corepack enable && pnpm install && VITE_API_URL=https://arabian-startups-api.onrender.com/api BASE_PATH=/ PORT=3000 pnpm --filter @workspace/arabian-startups run build
     ```
   - **Publish Directory**: `artifacts/arabian-startups/dist/public`
4. Set Environment Variables:
   - `NODE_ENV` = `production`
   - `VITE_API_URL` = `https://arabian-startups-api.onrender.com/api`  *(update after Step 1 deploys)*
5. Add Redirect/Rewrite Rules:
   - **Source**: `/api/*` → **Destination**: `https://arabian-startups-api.onrender.com/api/$1` → **Action**: Rewrite
   - **Source**: `/*` → **Destination**: `/index.html` → **Action**: Rewrite
6. Click **Create Static Site**

---

## Step 3: Seed Initial Data (One-time)

After the API service deploys:
1. Go to the API service → **Shell** tab
2. Run:
   ```bash
   export DATABASE_URL=<your_neon_connection_string>
   pnpm --filter @workspace/db run push
   ```
   This creates all database tables.
3. The news scraper will auto-run on next startup and start pulling live GCC startup news.

---

## Step 4: Keep the News Feed Running

Free Render web services **spin down after 15 minutes** of inactivity.

**Options to keep the live news feed running:**

1. **Upgrade to Render Starter ($7/mo)** — stays awake 24/7, cron runs daily at 07:00 AST
2. **Use UptimeRobot (free)** — ping the API URL every 10 minutes to keep it alive
   - Sign up at [uptimerobot.com](https://uptimerobot.com)
   - Add a monitor: `https://arabian-startups-api.onrender.com/api/healthz`
   - Set interval to 10 minutes
   - This keeps the service warm enough for the cron to fire
3. **Manual trigger** — visit the API URL or trigger it manually via a cron job elsewhere

---

## Your URLs After Deployment

- **API**: `https://arabian-startups-api.onrender.com/api/healthz`
- **Frontend**: `https://arabian-startups-web.onrender.com`
- **Daily News Feed**: Auto-fetches every day at 07:00 Saudi Arabia time

---

## Troubleshooting

**If the API fails to start:**
- Check logs in the API service → **Logs** tab
- Make sure `DATABASE_URL` is correct and the Neon database is active
- Verify `pnpm install` succeeded in the build
- **If you see `EROFS: read-only file system`**: Change `npm install -g pnpm` to `corepack enable` in the build command

**If the frontend shows no data:**
- Check browser console (F12) for CORS errors
- Verify `VITE_API_URL` in the Static Site env vars matches the actual API URL
- Check that the API rewrite rule is set correctly

**If the news scraper doesn't fetch:**
- The scraper runs on server startup. Free Render services spin down, so it won't run unless the service is kept warm.
- Many RSS feeds block scrapers (403/404) — this is handled gracefully; only working feeds contribute articles.
