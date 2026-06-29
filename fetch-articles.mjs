#!/usr/bin/env node
/**
 * fetch-articles.mjs
 *
 * Standalone RSS fetch script — runs in GitHub Actions, writes directly to
 * Neon DB. No Render dependency for fetching. GitHub Actions has unrestricted
 * outbound internet so every feed URL is reachable.
 *
 * Usage: node fetch-articles.mjs
 * Env:   DATABASE_URL  (Neon connection string)
 *        RSS2JSON_API_KEY (optional — rss2json.com key for bot-blocked feeds)
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, boolean, integer, timestamp, json } from "drizzle-orm/pg-core";
import { eq, sql, gte } from "drizzle-orm";
import Parser from "rss-parser";

// ─── DB Schema (inline — no workspace imports needed) ────────────────────────
const articlesTable = pgTable("articles", {
  id:          serial("id").primaryKey(),
  title:       text("title").notNull(),
  summary:     text("summary").notNull(),
  content:     text("content"),
  sourceUrl:   text("source_url").notNull(),
  sourceName:  text("source_name").notNull(),
  imageUrl:    text("image_url"),
  category:    text("category").notNull(),
  country:     text("country").notNull(),
  tags:        json("tags").default([]),
  isFeatured:  boolean("is_featured").default(false).notNull(),
  viewCount:   integer("view_count").default(0).notNull(),
  publishedAt: timestamp("published_at").notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

const fetchRunsTable = pgTable("fetch_runs", {
  id:               serial("id").primaryKey(),
  startedAt:        timestamp("started_at").notNull(),
  finishedAt:       timestamp("finished_at"),
  success:          boolean("success").default(false).notNull(),
  articlesInserted: integer("articles_inserted").default(0).notNull(),
  feedStats:        json("feed_stats").default({}),
  error:            text("error"),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
});

// ─── DB Connection ────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db   = drizzle(pool, { schema: { articlesTable, fetchRunsTable } });

// ─── Ensure fetch_runs table exists ──────────────────────────────────────────
async function ensureTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS fetch_runs (
      id                SERIAL PRIMARY KEY,
      started_at        TIMESTAMP NOT NULL,
      finished_at       TIMESTAMP,
      success           BOOLEAN NOT NULL DEFAULT FALSE,
      articles_inserted INTEGER NOT NULL DEFAULT 0,
      feed_stats        JSON DEFAULT '{}',
      error             TEXT,
      created_at        TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

// ─── Feed List ────────────────────────────────────────────────────────────────
const FEEDS = [
  // Priority Tier — core GCC startup/VC media
  { url: "https://wamda.com/feed",                                                                                          sourceName: "Wamda",                 isTrustedGCC: true },
  { url: "https://menabytes.com/feed/",                                                                                     sourceName: "MENAbytes",             isTrustedGCC: true },
  // Arabian Business blocks all bots including rss2json — use Google News RSS instead
  { url: "https://news.google.com/rss/search?q=site:arabianbusiness.com+startup&hl=en-US&gl=US&ceid=US:en",                sourceName: "Arabian Business",      isTrustedGCC: true },
  { url: "https://techcrunch.com/tag/middle-east/feed/",                                                                   sourceName: "TechCrunch MENA",       isTrustedGCC: true },
  { url: "https://techcrunch.com/tag/saudi-arabia/feed/",                                                                  sourceName: "TechCrunch Saudi",      isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://techcrunch.com/tag/dubai/feed/",                                                                         sourceName: "TechCrunch Dubai",      isTrustedGCC: true,  forceCountry: "UAE" },
  // Forbes ME blocks bots — use Google News RSS instead
  { url: "https://news.google.com/rss/search?q=site:forbesmiddleeast.com+startup&hl=en-US&gl=US&ceid=US:en",              sourceName: "Forbes Middle East",    isTrustedGCC: true },
  // Gulf Business was getting 403 only via proxy — try direct first (no proxyOnly)
  { url: "https://gulfbusiness.com/feed/",                                                                                 sourceName: "Gulf Business",         isTrustedGCC: true },
  // Zawya requires login session — use their alternate public feed
  { url: "https://www.zawya.com/rss/feed.xml",                                                                             sourceName: "Zawya Startups",        isTrustedGCC: true },
  // Entrepreneur ME RSS is broken/unstable — use Google News RSS instead
  { url: "https://news.google.com/rss/search?q=site:entrepreneur.com/en-ae&hl=en-US&gl=US&ceid=US:en",                   sourceName: "Entrepreneur ME",       isTrustedGCC: true },
  // Khaleej Times — try direct without proxyOnly
  { url: "https://www.khaleejtimes.com/arc/outboundfeeds/rss/?outputType=xml",                                            sourceName: "Khaleej Times",         isTrustedGCC: true },
  // Saudi Arabia
  // Argaam English RSS moved endpoint
  { url: "https://www.argaam.com/en/article/rss",                                                                         sourceName: "Argaam",                isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.arabnews.com/taxonomy/term/10251/feed",                                                              sourceName: "Arab News Business",    isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.arabnews.com/taxonomy/term/4022/feed",                                                               sourceName: "Arab News Tech",        isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.spa.gov.sa/rss/en",                                                                                  sourceName: "Saudi Press Agency",    isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://saudistartups.org/feed/",                                                                                sourceName: "Saudi Startups",        isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://miskhub.com/feed/",                                                                                      sourceName: "Misk Hub",              isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://monshaat.gov.sa/en/rss.xml",                                                                             sourceName: "Monsha'at",             isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://waed.com/feed/",                                                                                         sourceName: "Wa'ed Aramco Ventures", isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.badir.com.sa/feed",                                                                                  sourceName: "Badir Program",         isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.taqadam.org/feed/",                                                                                  sourceName: "TAQADAM KAUST",         isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.startupgrind.com/blog/feed/?tag=saudi",                                                             sourceName: "Startup Grind Saudi",   isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  // UAE
  { url: "https://hub71.com/news/feed/",                                                                                   sourceName: "Hub71",                 isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://flat6labs.com/blog/feed/",                                                                               sourceName: "Flat6Labs",             isTrustedGCC: true },
  { url: "https://astrolabs.com/blog/feed/",                                                                               sourceName: "AstroLabs",             isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://www.in5.ae/news/feed/",                                                                                  sourceName: "In5 Dubai",             isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://dtec.ae/feed/",                                                                                          sourceName: "Dtec Dubai",            isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://www.startupgrind.com/blog/feed/?tag=dubai",                                                             sourceName: "Startup Grind Dubai",   isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://www.brinc.io/blog/rss.xml",                                                                             sourceName: "Brinc Accelerator",     isTrustedGCC: true },
  // Qatar, Bahrain, Oman
  { url: "https://startupbahrain.com/feed/",                                                                               sourceName: "Startup Bahrain",       isTrustedGCC: true,  forceCountry: "Bahrain" },
  { url: "https://www.tamkeen.bh/news/feed/",                                                                              sourceName: "Tamkeen Bahrain",       isTrustedGCC: true,  forceCountry: "Bahrain" },
  { url: "https://www.qstp.org.qa/news/feed/",                                                                             sourceName: "QSTP Qatar",            isTrustedGCC: true,  forceCountry: "Qatar" },
  { url: "https://otf.om/feed/",                                                                                           sourceName: "Oman Technology Fund",  isTrustedGCC: true,  forceCountry: "Oman" },
  // Global
  { url: "https://500.co/feed/",                                                                                           sourceName: "500 Global",            isTrustedGCC: true },
  { url: "https://www.techstars.com/feed",                                                                                 sourceName: "Techstars",             isTrustedGCC: false },
  { url: "https://sifted.eu/rss",                                                                                          sourceName: "Sifted",                isTrustedGCC: false },
];

// ─── Keyword Maps ─────────────────────────────────────────────────────────────
const COUNTRY_KEYWORDS = {
  "Saudi Arabia": ["saudi","ksa","riyadh","jeddah","dammam","mecca","medina","aramco","sabic","vision 2030","neom","pif","svc","monshaat","wa'ed","waed","badir","kacst","taqadam","misk","impact46","raed ventures","seedra","hala ventures","stc ventures","elm company"],
  "UAE":          ["uae","dubai","abu dhabi","sharjah","ajman","ras al khaimah","emirati","difc","adgm","adq","mubadala","hub71","area 2071","startad","in5","dtec","astrolabs","twofour54","turn8","brinc","silicon oasis","tecom","gitex"],
  "Kuwait":       ["kuwait","kuwaiti","kuwait city","boursa kuwait","kfas"],
  "Qatar":        ["qatar","doha","qatari","qia","qstp","qfc","lusail","sidra"],
  "Bahrain":      ["bahrain","manama","bahraini","cbb","tamkeen","bahrain bay","fintech bay"],
  "Oman":         ["oman","muscat","omani","otf","oman technology fund"],
};

const CATEGORY_KEYWORDS = {
  "Incubators & Accelerators": ["incubator","accelerator","cohort","batch","demo day","hub71","flat6labs","taqadam","misk hub","badir","wa'ed","waed","in5","dtec","astrolabs","brinc","monsha'at","tamkeen","otf","qstp","500 global","techstars","startup studio","launchpad","applications open","call for startups"],
  "Funding":      ["raise","raised","funding","series a","series b","series c","series d","investment","venture capital","seed round","pre-seed","million","billion","capital","backed","investor","angel","grant","equity","vc fund"],
  "Acquisitions": ["acqui","merger","bought","purchase","takeover","stake","acquires","acquired","m&a","exit","buyout"],
  "Launches":     ["launch","launches","unveiled","introduces","announces new","new product","debut","rollout","goes live","open for applications"],
  "Policy":       ["regulation","regulatory","government","ministry","law","license","vision 2030","initiative","policy","national strategy","royal decree","cabinet","framework"],
  "People":       ["ceo","founder","appoints","joins","hired","promoted","leadership","executive","co-founder","managing director","named as"],
  "Growth":       ["milestone","expands","expansion","growth","revenue","users","customers","ipo","listing","unicorn","valuation","profitability"],
  "Technology":   ["ai","artificial intelligence","machine learning","blockchain","fintech","saas","cloud","platform","digital","software","app","deeptech","cybersecurity","healthtech","edtech","proptech","agritech","web3"],
  "Ecosystem":    ["hackathon","meetup","event","summit","conference","workshop","pitch competition","partnership","ecosystem","community","report","index","ranking"],
};

const GCC_TERMS = [
  "saudi arabia","saudi","ksa","riyadh","jeddah","dammam",
  "uae","dubai","abu dhabi","sharjah","ajman","emirati",
  "kuwait","kuwaiti","qatar","doha","qatari",
  "bahrain","manama","bahraini","oman","muscat","omani",
  "gcc","neom","vision 2030","vision2030",
  "hub71","flat6labs","taqadam","misk hub","misk","badir",
  "wa'ed","waed","in5","dtec","astrolabs","tamkeen","qstp",
  "monsha'at","monshaat","otf","difc","adgm",
];
const NON_GCC_COUNTRIES = [
  "egypt","egyptian","cairo","iran","iranian","tehran",
  "israel","israeli","tel aviv","lebanon","beirut","lebanese",
  "iraq","iraqi","baghdad","syria","syrian","turkey","turkish",
  "jordan","jordanian","amman","morocco","moroccan","algeria",
  "tunisia","libya","libyan","sudan","sudanese","yemen","yemeni",
];

const STARTUP_KEYWORDS = [
  "startup","startups","founder","co-founder","cofounder",
  "entrepreneur","entrepreneurship","early-stage",
  "venture capital","vc fund","vc-backed",
  "seed round","pre-seed","series a","series b","series c","series d",
  "funding round","angel round","angel investor",
  "accelerator","incubator","cohort","batch","demo day",
  "call for startups","applications open","launchpad",
  "startup program","startup competition","startup studio",
  "fintech","healthtech","edtech","proptech","agritech",
  "saas","deeptech","web3","ai startup","tech startup",
  "unicorn","valuation","scale-up","scaleup","product launch",
  "acqui-hire","hub71","flat6labs","taqadam","misk hub",
  "y combinator","techstars","500 global",
  "pitch competition","hackathon",
];
const HARD_BLOCK_SIGNALS = [
  "helicopter crash","killed","airstrike","missile","drone strike",
  "ceasefire","retaliation","warship","crude oil","oil price",
  "gold price","silver price","bitcoin","crypto market",
  "precious metal","commodity","barrel","brent crude",
  "interest rate","treasury yield","monetary policy",
  "privatization","state-owned","government-owned",
  "ipo program","stock exchange listing","capital market",
];

// ─── Classification helpers ───────────────────────────────────────────────────
function isGCCRelevant(text) {
  const lower   = text.toLowerCase();
  const gccHits = GCC_TERMS.filter(t => lower.includes(t)).length;
  if (gccHits === 0) return false;
  const nonGccHit = NON_GCC_COUNTRIES.some(c => lower.includes(c));
  if (nonGccHit && gccHits === 0) return false;
  return true;
}

function isStartupRelevant(text) {
  const lower = text.toLowerCase();
  if (HARD_BLOCK_SIGNALS.some(s => lower.includes(s))) return false;
  return STARTUP_KEYWORDS.some(kw => lower.includes(kw));
}

function detectCountry(text, forceCountry) {
  if (forceCountry) return forceCountry;
  const lower = text.toLowerCase();
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return country;
  }
  return "GCC";
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return "Ecosystem";
}

// ─── Image helpers ────────────────────────────────────────────────────────────
function extractImageFromHtml(html) {
  if (!html) return null;
  const imgMatch    = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]?.startsWith("http")) return imgMatch[1];
  const dataSrc     = html.match(/<img[^>]+data-src=["']([^"']+)["']/i);
  if (dataSrc?.[1]?.startsWith("http")) return dataSrc[1];
  const srcset      = html.match(/srcset=["']([^"'\s,]+)/i);
  if (srcset?.[1]?.startsWith("http")) return srcset[1];
  const ogMatch     = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                   || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1]?.startsWith("http")) return ogMatch[1];
  const mediaMatch  = html.match(/media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch?.[1]?.startsWith("http")) return mediaMatch[1];
  return null;
}

const BROWSER_HEADERS = {
  "User-Agent":      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Encoding": "identity",  // disable compression — prevents truncated XML (e.g. Arab News)
};

async function fetchOgImage(articleUrl) {
  try {
    const res = await fetch(articleUrl, { signal: AbortSignal.timeout(8000), headers: BROWSER_HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    const ogA  = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogA?.[1]?.startsWith("http")) return ogA[1];
    const ogB  = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogB?.[1]?.startsWith("http")) return ogB[1];
    const ogNA = html.match(/<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogNA?.[1]?.startsWith("http")) return ogNA[1];
    const twA  = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (twA?.[1]?.startsWith("http")) return twA[1];
    const twB  = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twB?.[1]?.startsWith("http")) return twB[1];
    // Last resort: first substantial <img> in article body
    const body = html.match(/<article[\s\S]*?<\/article>/i)?.[0]
              || html.match(/<main[\s\S]*?<\/main>/i)?.[0]
              || html;
    for (const tag of (body.match(/<img[^>]+>/gi) ?? [])) {
      const src = tag.match(/(?:data-)?src=["']([^"']+)["']/i)?.[1];
      if (!src?.startsWith("http")) continue;
      if (/logo|icon|avatar|spacer|pixel|\.svg(\?|$)/i.test(src)) continue;
      const w = tag.match(/width=["']?(\d+)/i)?.[1];
      if (w && Number(w) < 200) continue;
      return src;
    }
  } catch { /* silent */ }
  return null;
}

// ─── XML Sanitizer ────────────────────────────────────────────────────────────
function sanitizeFeedXml(xml) {
  return xml
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/g, "&amp;")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

// ─── RSS Parsers ──────────────────────────────────────────────────────────────
const directParser = new Parser({
  timeout: 15000,
  headers: { ...BROWSER_HEADERS, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
  xml2js:  { strict: false, normalize: true },
  customFields: {
    feed: [["atom:link", "atomLink"]],
    item: [["atom:summary", "atomSummary"], ["atom:content", "atomContent"]],
  },
});

async function fetchFeedDirect(feedUrl) {
  const res = await fetch(feedUrl, {
    signal:  AbortSignal.timeout(15000),
    headers: { ...BROWSER_HEADERS, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml  = sanitizeFeedXml(await res.text());
  const feed = await directParser.parseString(xml);
  return (feed.items ?? []).slice(0, 20).map(item => {
    const raw     = item;
    const content = item.content || raw["content:encoded"] || item.atomContent || "";
    const desc    = item.summary || item.contentSnippet || item.atomSummary || content || "";
    let imageUrl  = null;
    const enc     = item.enclosure;
    if (enc?.url?.startsWith("http") && (enc.type?.startsWith("image") || /\.(jpe?g|png|webp|gif)/i.test(enc.url))) {
      imageUrl = enc.url;
    }
    if (!imageUrl) {
      const mc = raw["media:content"];
      if (mc?.$?.url?.startsWith("http")) imageUrl = mc.$.url;
    }
    if (!imageUrl) imageUrl = extractImageFromHtml(content || desc);
    return { title: item.title ?? "", link: item.link ?? "", pubDate: item.pubDate || item.isoDate || "", description: desc, content, imageUrl };
  });
}

async function fetchFeedViaProxy(feedUrl) {
  const apiKey   = process.env.RSS2JSON_API_KEY ?? "";
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "";
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=20${keyParam}`;
  const res      = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`rss2json HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.status !== "ok") throw new Error(`rss2json status: ${data.status} — ${data.message ?? ""}`);
  return (data.items ?? []).map(item => ({
    title:       item.title ?? "",
    link:        item.link  ?? "",
    pubDate:     item.pubDate ?? "",
    description: item.description ?? "",
    content:     item.content ?? "",
    imageUrl:    item.thumbnail?.startsWith("http") ? item.thumbnail
               : (item.enclosure?.link || item.enclosure?.url)?.startsWith("http") ? (item.enclosure.link || item.enclosure.url)
               : extractImageFromHtml(item.content || item.description || ""),
  }));
}

async function fetchFeedItems(feed) {
  if (!feed.proxyOnly) {
    try { return await fetchFeedDirect(feed.url); }
    catch (e) { console.warn(`⚠  Direct fetch failed for ${feed.sourceName}: ${e.message} — trying rss2json`); }
  }
  return await fetchFeedViaProxy(feed.url);
}

// ─── Per-feed fetch + insert ──────────────────────────────────────────────────
async function fetchAndStoreFeed(feed) {
  let inserted = 0;
  let error    = null;
  try {
    const items = await fetchFeedItems(feed);
    for (const item of items) {
      const title     = item.title?.trim() ?? "";
      const summary   = (item.description || item.content || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const sourceUrl = item.link ?? "";
      const rawDate   = item.pubDate ? new Date(item.pubDate) : null;
      const publishedAt = rawDate && !isNaN(rawDate.getTime()) ? rawDate : new Date();

      // Skip articles older than 30 days — they'd be pruned immediately anyway
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (publishedAt < thirtyDaysAgo) continue;
      if (!title || !sourceUrl) continue;
      const combined = `${title} ${summary}`;
      if (!feed.isTrustedGCC && !isGCCRelevant(combined)) continue;
      if (!isStartupRelevant(combined)) continue;
      // Dedup
      const existing = await db.select({ id: articlesTable.id }).from(articlesTable).where(eq(articlesTable.sourceUrl, sourceUrl)).limit(1);
      if (existing.length > 0) continue;
      const country  = detectCountry(combined, feed.forceCountry);
      const category = detectCategory(combined);
      let imageUrl   = item.imageUrl;
      if (!imageUrl) imageUrl = await fetchOgImage(sourceUrl);
      await db.insert(articlesTable).values({
        title:       title.slice(0, 500),
        summary:     (summary || title).slice(0, 1000),
        sourceUrl,
        sourceName:  feed.sourceName,
        imageUrl:    imageUrl ?? null,
        category,
        country,
        tags:        [],
        isFeatured:  false,
        viewCount:   0,
        publishedAt,
      });
      inserted++;
    }
    if (inserted > 0) console.log(`✅  ${feed.sourceName}: ${inserted} new articles`);
    else              console.log(`–   ${feed.sourceName}: 0 new (all seen or filtered)`);
  } catch (err) {
    error = err.message;
    console.warn(`❌  ${feed.sourceName}: ${err.message}`);
  }
  return { inserted, error };
}

// ─── Prune old articles ───────────────────────────────────────────────────────
async function pruneOldArticles() {
  // Use created_at (when WE stored it) not published_at (the feed's date).
  // This prevents freshly-inserted articles from being immediately pruned
  // because their feed pubDate happens to be old.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  await db.execute(sql`
    DELETE FROM articles
    WHERE is_featured = false
      AND created_at < ${cutoff.toISOString()}
  `);
  const countRes = await db.execute(sql`SELECT COUNT(*) as count FROM articles`);
  const total    = Number(countRes[0]?.count ?? 0);
  const MAX      = 500; // raised from 300 — gives more buffer before pruning fresh articles
  if (total > MAX) {
    await db.execute(sql`
      DELETE FROM articles WHERE id IN (
        SELECT id FROM articles
        WHERE is_featured = false
        ORDER BY created_at ASC
        LIMIT ${total - MAX}
      )
    `);
    console.log(`🗑  Pruned to ${MAX} articles`);
  }
}

// ─── Update category counts ───────────────────────────────────────────────────
async function updateCategoryCounts() {
  await db.execute(sql`
    UPDATE categories c SET article_count = sub.cnt
    FROM (SELECT category, COUNT(*) as cnt FROM articles GROUP BY category) sub
    WHERE c.name = sub.category
  `);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const startedAt  = new Date();
  let   total      = 0;
  const feedStats  = {};

  console.log(`\n🚀  Arabian Startups fetch starting — ${startedAt.toISOString()}`);
  console.log(`    Feeds: ${FEEDS.length}  |  DB: ${process.env.DATABASE_URL?.slice(0, 40)}…\n`);

  await ensureTables();

  for (const feed of FEEDS) {
    const { inserted, error } = await fetchAndStoreFeed(feed);
    total += inserted;
    feedStats[feed.sourceName] = { inserted, error };
    // Small delay between feeds to be respectful
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n📊  Total new articles: ${total}`);

  await pruneOldArticles();
  try { await updateCategoryCounts(); } catch { /* categories table may not exist in some envs */ }

  // Record run in fetch_runs
  await db.insert(fetchRunsTable).values({
    startedAt,
    finishedAt:       new Date(),
    success:          true,
    articlesInserted: total,
    feedStats,
    error:            null,
  });

  console.log(`\n✅  Done — ${total} articles inserted, run recorded.\n`);
  await pool.end();

  // Exit 1 if zero articles fetched (signals GitHub Actions to open issue)
  if (total === 0) {
    console.error("⚠  Zero articles fetched — all feeds may be down or already seen.");
    process.exit(1);
  }
}

main().catch(async err => {
  console.error("💥  Fatal error:", err.message);
  try {
    await db.insert(fetchRunsTable).values({
      startedAt:        new Date(),
      finishedAt:       new Date(),
      success:          false,
      articlesInserted: 0,
      feedStats:        {},
      error:            err.message,
    });
  } catch { /* ignore */ }
  await pool.end();
  process.exit(1);
});
