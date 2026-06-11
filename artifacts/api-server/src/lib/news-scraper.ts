import { db, articlesTable, digestsTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { logger } from "./logger";

interface Feed {
  url: string;
  sourceName: string;
  isTrustedGCC?: boolean;
  forceCountry?: string;
}

// ─── RSS Feeds — Saudi Arabia & GCC focused ───────────────────────────────────
const FEEDS: Feed[] = [
  // ── Core MENA Startup Media ──────────────────────────────────────────────────
  { url: "https://wamda.com/feed",                                   sourceName: "Wamda",                 isTrustedGCC: true },
  { url: "https://menabytes.com/feed/",                              sourceName: "MENAbytes",             isTrustedGCC: true },
  { url: "https://techcrunch.com/tag/middle-east/feed/",             sourceName: "TechCrunch MENA",       isTrustedGCC: true },
  { url: "https://techcrunch.com/tag/saudi-arabia/feed/",            sourceName: "TechCrunch Saudi",      isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://techcrunch.com/tag/dubai/feed/",                   sourceName: "TechCrunch Dubai",      isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://www.entrepreneur.com/en-ae/rss",                   sourceName: "Entrepreneur ME",       isTrustedGCC: true },
  { url: "https://forbesmiddleeast.com/feed/",                       sourceName: "Forbes Middle East",    isTrustedGCC: true },
  { url: "https://gulfbusiness.com/feed/",                           sourceName: "Gulf Business",         isTrustedGCC: true },
  { url: "https://www.arabianbusiness.com/rss",                      sourceName: "Arabian Business",      isTrustedGCC: true },
  { url: "https://www.zawya.com/en/rss/startups",                    sourceName: "Zawya Startups",        isTrustedGCC: true },
  { url: "https://www.khaleejtimes.com/feed/business",               sourceName: "Khaleej Times",         isTrustedGCC: true },
  // ── Saudi Arabia ─────────────────────────────────────────────────────────────
  { url: "https://www.arabnews.com/taxonomy/term/10251/feed",        sourceName: "Arab News Business",    isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://www.arabnews.com/taxonomy/term/4022/feed",         sourceName: "Arab News Tech",        isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://www.spa.gov.sa/rss/en",                            sourceName: "Saudi Press Agency",    isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://saudistartups.org/feed/",                          sourceName: "Saudi Startups",        isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://miskhub.com/feed/",                                sourceName: "Misk Hub",              isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://monshaat.gov.sa/en/rss.xml",                       sourceName: "Monsha'at",             isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://waed.com/feed/",                                   sourceName: "Wa'ed Aramco Ventures", isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://www.badir.com.sa/feed",                            sourceName: "Badir Program",         isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://www.taqadam.org/feed/",                            sourceName: "TAQADAM KAUST",         isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://www.startupgrind.com/blog/feed/?tag=saudi",        sourceName: "Startup Grind Saudi",   isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  // ── UAE ──────────────────────────────────────────────────────────────────────
  { url: "https://hub71.com/news/feed/",                             sourceName: "Hub71",                 isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://flat6labs.com/blog/feed/",                         sourceName: "Flat6Labs",             isTrustedGCC: true },
  { url: "https://astrolabs.com/blog/feed/",                         sourceName: "AstroLabs",             isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://www.in5.ae/news/feed/",                            sourceName: "In5 Dubai",             isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://dtec.ae/feed/",                                    sourceName: "Dtec Dubai",            isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://www.startupgrind.com/blog/feed/?tag=dubai",        sourceName: "Startup Grind Dubai",   isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://www.brinc.io/blog/rss.xml",                        sourceName: "Brinc Accelerator",     isTrustedGCC: true },
  // ── Qatar, Bahrain, Kuwait, Oman ─────────────────────────────────────────────
  { url: "https://startupbahrain.com/feed/",                         sourceName: "Startup Bahrain",       isTrustedGCC: true, forceCountry: "Bahrain" },
  { url: "https://www.tamkeen.bh/news/feed/",                        sourceName: "Tamkeen Bahrain",       isTrustedGCC: true, forceCountry: "Bahrain" },
  { url: "https://www.qstp.org.qa/news/feed/",                       sourceName: "QSTP Qatar",            isTrustedGCC: true, forceCountry: "Qatar" },
  { url: "https://otf.om/feed/",                                     sourceName: "Oman Technology Fund",  isTrustedGCC: true, forceCountry: "Oman" },
  // ── Events & Global ──────────────────────────────────────────────────────────
  { url: "https://500.co/feed/",                                     sourceName: "500 Global",            isTrustedGCC: true },
  { url: "https://www.techstars.com/feed",                           sourceName: "Techstars",             isTrustedGCC: false },
  { url: "https://sifted.eu/rss",                                    sourceName: "Sifted",                isTrustedGCC: false },
];

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  "Saudi Arabia": ["saudi", "ksa", "riyadh", "jeddah", "dammam", "mecca", "medina", "aramco", "sabic", "vision 2030", "neom", "pif", "svc", "monshaat", "wa'ed", "waed", "badir", "kacst", "taqadam", "misk", "impact46", "raed ventures", "seedra", "hala ventures", "stc ventures", "elm company"],
  UAE: ["uae", "dubai", "abu dhabi", "sharjah", "ajman", "ras al khaimah", "emirati", "difc", "adgm", "adq", "mubadala", "hub71", "area 2071", "startad", "in5", "dtec", "astrolabs", "twofour54", "turn8", "brinc", "silicon oasis", "tecom", "gitex"],
  Kuwait: ["kuwait", "kuwaiti", "kuwait city", "boursa kuwait", "kfas"],
  Qatar: ["qatar", "doha", "qatari", "qia", "qstp", "qfc", "lusail", "sidra"],
  Bahrain: ["bahrain", "manama", "bahraini", "cbb", "tamkeen", "bahrain bay", "fintech bay"],
  Oman: ["oman", "muscat", "omani", "otf", "oman technology fund"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Incubators & Accelerators": [
    "incubator", "accelerator", "acceleration program", "cohort", "batch",
    "startup program", "demo day", "hub71", "flat6labs", "taqadam", "misk hub",
    "badir", "wa'ed", "waed", "in5", "dtec", "astrolabs", "brinc", "turn8",
    "monsha'at", "tamkeen", "otf", "qstp", "startad", "twofour54", "area 2071",
    "500 startups", "500 global", "y combinator", "techstars", "plug and play",
    "startup studio", "venture studio", "pre-seed program", "bootcamp",
    "open for applications", "applications open", "apply now", "call for startups",
    "launchpad", "launch pad",
  ],
  Funding: [
    "raise", "raised", "funding", "series a", "series b", "series c", "series d",
    "investment", "venture capital", "seed round", "pre-seed", "million", "billion",
    "capital", "backed", "investor", "angel", "grant", "equity", "vc fund",
    "closes fund", "fund close", "lead investor", "co-investor",
  ],
  Acquisitions: ["acqui", "merger", "bought", "purchase", "takeover", "stake", "acquires", "acquired", "m&a", "exit", "buyout", "strategic investment"],
  Launches: ["launch", "launches", "unveiled", "introduces", "announces new", "new product", "debut", "rollout", "goes live", "open for applications", "now available"],
  Policy: ["regulation", "regulatory", "government", "ministry", "law", "license", "licensed", "central bank", "vision 2030", "initiative", "policy", "national strategy", "royal decree", "cabinet", "framework"],
  People: ["ceo", "founder", "appoints", "joins", "hired", "promoted", "leadership", "executive", "co-founder", "managing director", "named as"],
  Growth: ["milestone", "expands", "expansion", "growth", "revenue", "users", "customers", "ipo", "listing", "unicorn", "valuation", "profitability"],
  Technology: ["ai", "artificial intelligence", "machine learning", "blockchain", "fintech", "saas", "cloud", "platform", "digital", "software", "app", "deeptech", "cybersecurity", "healthtech", "edtech", "proptech", "agritech", "web3"],
  Ecosystem: ["hackathon", "meetup", "event", "summit", "conference", "workshop", "pitch competition", "startup competition", "demo day", "investor day", "networking", "panel", "fireside", "partnership", "collaboration", "ecosystem", "community", "hub", "report", "index", "ranking", "entrepreneurship world cup", "startup world cup"],
};

const GCC_TERMS = [
  "saudi", "uae", "dubai", "abu dhabi", "kuwait", "qatar", "bahrain", "oman",
  "gulf", "gcc", "mena", "middle east", "arab", "riyadh", "doha", "manama",
  "muscat", "sharjah", "ajman", "ksa", "neom", "vision 2030",
  "hub71", "flat6labs", "taqadam", "misk", "badir", "wa'ed", "waed", "in5",
  "dtec", "astrolabs", "tamkeen", "qstp", "monsha'at", "monshaat", "otf",
];

function isGCCRelevant(text: string): boolean {
  return GCC_TERMS.some((t) => text.toLowerCase().includes(t));
}

// ─── Startup relevance filter — blocks non-startup content ───────────────────
// Any article (from any source) must match at least one of these to be stored.
const STARTUP_KEYWORDS = [
  // Core startup terms
  "startup", "startups", "founder", "co-founder", "cofounder", "entrepreneur", "entrepreneurship",
  // Funding & investment
  "funding", "funded", "investment", "investor", "venture capital", "vc fund",
  "seed round", "pre-seed", "series a", "series b", "series c", "series d",
  "raise", "raised", "grant", "equity", "capital",
  // Programs & support
  "accelerator", "incubator", "cohort", "batch", "demo day", "program",
  "call for startups", "applications open", "apply now", "launchpad",
  // Company events
  "launch", "launches", "launched", "unveiled", "product launch", "goes live",
  "acquisition", "acquires", "acquired", "merger", "ipo", "listing", "exit",
  "unicorn", "valuation", "scale-up", "scaleup",
  // Tech sectors
  "fintech", "healthtech", "edtech", "proptech", "agritech", "saas", "deeptech",
  "web3", "ai startup", "tech company", "tech startup",
  // Ecosystem signals
  "innovation", "ecosystem", "hub71", "flat6labs", "taqadam", "misk hub",
  "pitch", "pitching", "hackathon", "demo", "startup competition",
];

function isStartupRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return STARTUP_KEYWORDS.some((kw) => lower.includes(kw));
}

function detectCountry(text: string, forceCountry?: string): string {
  if (forceCountry) return forceCountry;
  const lower = text.toLowerCase();
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return country;
  }
  return "GCC";
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "Ecosystem";
}

// ─── Auto-cleanup: keep DB lean (max 300 articles, safe for Neon free tier) ──
// Articles older than 30 days are also deleted regardless of count.
async function pruneOldArticles(): Promise<void> {
  try {
    // 1. Always delete articles older than 30 days (keeps Neon storage tiny)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const ageResult = await db.execute(sql`
      DELETE FROM articles
      WHERE is_featured = false AND published_at < ${cutoff.toISOString()}
    `);
    logger.info({ cutoff: cutoff.toISOString() }, "Pruned articles older than 30 days");

    // 2. If still over 300, drop oldest non-featured to get back to 300
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM articles`);
    const total = Number(countResult[0]?.count ?? 0);
    const MAX_ARTICLES = 300;
    if (total > MAX_ARTICLES) {
      const deleteCount = total - MAX_ARTICLES;
      await db.execute(sql`
        DELETE FROM articles WHERE id IN (
          SELECT id FROM articles WHERE is_featured = false
          ORDER BY published_at ASC LIMIT ${deleteCount}
        )
      `);
      logger.info({ deleted: deleteCount, remaining: MAX_ARTICLES }, "Pruned old articles to cap");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to prune old articles");
  }
}

// ─── RSS2JSON Response types ──────────────────────────────────────────────────
interface Rss2JsonEnclosure {
  link?: string;
  url?:  string;
  type?: string;
}

interface Rss2JsonItem {
  title:       string;
  link:        string;
  pubDate:     string;
  description: string;
  content:     string;
  // rss2json exposes the image in multiple places depending on the feed
  thumbnail?:       string;
  enclosure?:       Rss2JsonEnclosure;
  "media:content"?: { url?: string };
}

interface Rss2JsonResponse {
  status: string;
  feed?: { image?: string };
  items: Rss2JsonItem[];
}

// ─── Extract the best image URL from an rss2json item ────────────────────────
function extractImageUrl(item: Rss2JsonItem): string | null {
  // 1. rss2json thumbnail (most common for MENA feeds)
  if (item.thumbnail && item.thumbnail.startsWith("http")) return item.thumbnail;

  // 2. <enclosure> tag (common on Arab News, Forbes ME, Gulf Business)
  const enc = item.enclosure;
  if (enc) {
    const encUrl = enc.link || enc.url;
    if (encUrl && encUrl.startsWith("http") && (enc.type?.startsWith("image") || /\.(jpe?g|png|webp|gif)/i.test(encUrl))) {
      return encUrl;
    }
  }

  // 3. Scrape from HTML content/description
  const html = item.content || item.description || "";

  // 3a. Standard <img src="...">
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1] && imgMatch[1].startsWith("http")) return imgMatch[1];

  // 3b. Lazy-load <img data-src="..."> (Wamda, MENAbytes use this pattern)
  const dataSrcMatch = html.match(/<img[^>]+data-src=["']([^"']+)["']/i);
  if (dataSrcMatch?.[1] && dataSrcMatch[1].startsWith("http")) return dataSrcMatch[1];

  // 3c. srcset — grab first URL
  const srcsetMatch = html.match(/srcset=["']([^"'\s,]+)/i);
  if (srcsetMatch?.[1] && srcsetMatch[1].startsWith("http")) return srcsetMatch[1];

  // 4. og:image meta embedded in feed content
  const ogMatch = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1] && ogMatch[1].startsWith("http")) return ogMatch[1];

  // 5. media:content url attribute
  const mediaMatch = html.match(/media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch?.[1] && mediaMatch[1].startsWith("http")) return mediaMatch[1];

  return null;
}

// ─── Fetch og:image from the article page when RSS has no image ──────────────
// Many MENA feeds (Forbes ME, Arab News, Zawya, Khaleej Times) strip images
// from their RSS. We fetch the actual article page and pull the og:image or
// twitter:image meta tag — this is the same image the article shows on site.
// 5 s timeout so the daily run stays fast; silently skips on any error.
async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ArabianStartupsBot/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // og:image — standard, used by Forbes ME, TechCrunch, Wamda, MENAbytes
    const ogA = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogA?.[1]?.startsWith("http")) return ogA[1];
    const ogB = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogB?.[1]?.startsWith("http")) return ogB[1];

    // twitter:image — fallback used by Arab News, Gulf Business, Arabianbusiness
    const twA = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (twA?.[1]?.startsWith("http")) return twA[1];
    const twB = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twB?.[1]?.startsWith("http")) return twB[1];

    return null;
  } catch {
    return null;
  }
}

// ─── RSS2JSON Proxy Fetcher ───────────────────────────────────────────────────
// API key is required — set RSS2JSON_API_KEY in Render environment variables.
// Without it, anonymous requests share a tiny quota and will be rate-limited.
async function fetchFeedViaProxy(feedUrl: string): Promise<Rss2JsonItem[]> {
  const apiKey = process.env.RSS2JSON_API_KEY ?? "";
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "";
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=20${keyParam}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`rss2json returned ${res.status}`);
  const data = await res.json() as Rss2JsonResponse;
  if (data.status !== "ok") throw new Error(`rss2json status: ${data.status}`);
  return data.items ?? [];
}

// ─── Feed Fetcher ─────────────────────────────────────────────────────────────
export async function fetchAndStoreFeed(feed: Feed): Promise<number> {
  let inserted = 0;
  try {
    const items = await fetchFeedViaProxy(feed.url);

    for (const item of items) {
      const title     = item.title?.trim() ?? "";
      const summary   = (item.description || item.content || "")
                          .replace(/<[^>]*>/g, "")
                          .replace(/\s+/g, " ")
                          .trim();
      const sourceUrl = item.link ?? "";
      const rawDate   = item.pubDate ? new Date(item.pubDate) : null;
      const publishedAt = rawDate && !isNaN(rawDate.getTime()) ? rawDate : new Date();

      if (!title || !sourceUrl) continue;

      const combined = `${title} ${summary}`;
      if (!feed.isTrustedGCC && !isGCCRelevant(combined)) continue;
      if (!isStartupRelevant(combined)) continue;

      // Skip duplicates
      const existing = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(eq(articlesTable.sourceUrl, sourceUrl))
        .limit(1);
      if (existing.length > 0) continue;

      const country  = detectCountry(combined, feed.forceCountry);
      const category = detectCategory(combined);

      // ── Extract image: RSS feed first, then og:image from article page ────────
      let imageUrl = extractImageUrl(item);
      if (!imageUrl && sourceUrl) {
        imageUrl = await fetchOgImage(sourceUrl);
      }

      await db.insert(articlesTable).values({
        title:      title.slice(0, 500),
        summary:    (summary || title).slice(0, 1000),
        sourceUrl,
        sourceName: feed.sourceName,
        imageUrl:   imageUrl ?? null,   // ← stored per-article now
        category,
        country,
        tags:       [],
        isFeatured: false,
        viewCount:  0,
        publishedAt,
      });
      inserted++;
    }

    if (inserted > 0) logger.info({ feed: feed.sourceName, inserted }, "Feed processed");
  } catch (err) {
    logger.warn({ err, feed: feed.url }, "Failed to fetch feed");
  }
  return inserted;
}

// ─── Daily Run ────────────────────────────────────────────────────────────────
export async function runDailyFetch(): Promise<void> {
  logger.info("Starting daily news fetch");
  let total = 0;
  for (const feed of FEEDS) {
    const count = await fetchAndStoreFeed(feed);
    total += count;
    // Respect rss2json's 1 request/second rate limit
    await new Promise((r) => setTimeout(r, 1100));
  }
  logger.info({ total }, "Daily fetch complete");
  await pruneOldArticles();
  await db.execute(
    sql`UPDATE categories c SET article_count = sub.cnt FROM
        (SELECT category, COUNT(*) as cnt FROM articles GROUP BY category) sub
        WHERE c.name = sub.category`
  );
  await generateDailyDigest();
}

// ─── Digest Generator ─────────────────────────────────────────────────────────
async function generateDailyDigest(): Promise<void> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]!;
  today.setHours(0, 0, 0, 0);

  const todaysArticles = await db
    .select()
    .from(articlesTable)
    .where(gte(articlesTable.publishedAt, today))
    .orderBy(desc(articlesTable.viewCount))
    .limit(30);

  if (todaysArticles.length === 0) {
    logger.info("No articles today — skipping digest");
    return;
  }

  const highlights = todaysArticles.slice(0, 6).map((a) => {
    const truncated = a.summary.length > 90 ? a.summary.slice(0, 87) + "…" : a.summary;
    return `${a.country}: ${truncated}`;
  });

  const categories = [...new Set(todaysArticles.map((a) => a.category))];
  const countryCounts: Record<string, number> = {};
  for (const a of todaysArticles) { countryCounts[a.country] = (countryCounts[a.country] ?? 0) + 1; }
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c).join(", ");
  const incubatorCount = todaysArticles.filter((a) => a.category === "Incubators & Accelerators").length;
  const incubatorNote = incubatorCount > 0 ? ` Incubator and accelerator activity featured ${incubatorCount} stories today.` : "";
  const summary =
    `Today's GCC startup ecosystem digest covers ${todaysArticles.length} stories across ${categories.length} categories. ` +
    `Top coverage from: ${topCountries}.` + incubatorNote +
    ` Key themes include ${categories.slice(0, 4).join(", ")}.`;

  const existing = await db.select().from(digestsTable).where(eq(digestsTable.date, dateStr)).limit(1);
  if (existing.length > 0) {
    await db.update(digestsTable).set({ summary, highlights, articleCount: todaysArticles.length }).where(eq(digestsTable.date, dateStr));
  } else {
    await db.insert(digestsTable).values({ date: dateStr, summary, highlights, articleCount: todaysArticles.length });
  }
  logger.info({ date: dateStr, articles: todaysArticles.length }, "Digest generated");
}
