import { db, articlesTable, digestsTable, fetchRunsTable, type FeedRunStat } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { logger } from "./logger";
import Parser from "rss-parser";

interface Feed {
  url: string;
  sourceName: string;
  isTrustedGCC?: boolean;
  forceCountry?: string;
  proxyOnly?: boolean;
}

const FEEDS: Feed[] = [
  { url: "https://wamda.com/feed",                                   sourceName: "Wamda",                 isTrustedGCC: true },
  { url: "https://menabytes.com/feed/",                              sourceName: "MENAbytes",             isTrustedGCC: true },
  { url: "https://www.arabianbusiness.com/rss",                      sourceName: "Arabian Business",      isTrustedGCC: true,  proxyOnly: true },
  { url: "https://techcrunch.com/tag/middle-east/feed/",             sourceName: "TechCrunch MENA",       isTrustedGCC: true },
  { url: "https://techcrunch.com/tag/saudi-arabia/feed/",            sourceName: "TechCrunch Saudi",      isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://techcrunch.com/tag/dubai/feed/",                   sourceName: "TechCrunch Dubai",      isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://forbesmiddleeast.com/feed/",                       sourceName: "Forbes Middle East",    isTrustedGCC: true,  proxyOnly: true },
  { url: "https://gulfbusiness.com/feed/",                           sourceName: "Gulf Business",         isTrustedGCC: true },
  { url: "https://www.zawya.com/en/rss/startups",                    sourceName: "Zawya Startups",        isTrustedGCC: true,  proxyOnly: true },
  { url: "https://www.entrepreneur.com/en-ae/rss",                   sourceName: "Entrepreneur ME",       isTrustedGCC: true },
  { url: "https://www.khaleejtimes.com/feed/business",               sourceName: "Khaleej Times",         isTrustedGCC: true,  proxyOnly: true },
  { url: "https://www.argaam.com/en/rss",                            sourceName: "Argaam",                isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.arabnews.com/taxonomy/term/10251/feed",        sourceName: "Arab News Business",    isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.arabnews.com/taxonomy/term/4022/feed",         sourceName: "Arab News Tech",        isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.spa.gov.sa/rss/en",                            sourceName: "Saudi Press Agency",    isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://saudistartups.org/feed/",                          sourceName: "Saudi Startups",        isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://miskhub.com/feed/",                                sourceName: "Misk Hub",              isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://monshaat.gov.sa/en/rss.xml",                       sourceName: "Monsha'at",             isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://waed.com/feed/",                                   sourceName: "Wa'ed Aramco Ventures", isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.badir.com.sa/feed",                            sourceName: "Badir Program",         isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.taqadam.org/feed/",                            sourceName: "TAQADAM KAUST",         isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://www.startupgrind.com/blog/feed/?tag=saudi",        sourceName: "Startup Grind Saudi",   isTrustedGCC: true,  forceCountry: "Saudi Arabia" },
  { url: "https://hub71.com/news/feed/",                             sourceName: "Hub71",                 isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://flat6labs.com/blog/feed/",                         sourceName: "Flat6Labs",             isTrustedGCC: true },
  { url: "https://astrolabs.com/blog/feed/",                         sourceName: "AstroLabs",             isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://www.in5.ae/news/feed/",                            sourceName: "In5 Dubai",             isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://dtec.ae/feed/",                                    sourceName: "Dtec Dubai",            isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://www.startupgrind.com/blog/feed/?tag=dubai",        sourceName: "Startup Grind Dubai",   isTrustedGCC: true,  forceCountry: "UAE" },
  { url: "https://www.brinc.io/blog/rss.xml",                        sourceName: "Brinc Accelerator",     isTrustedGCC: true },
  { url: "https://startupbahrain.com/feed/",                         sourceName: "Startup Bahrain",       isTrustedGCC: true,  forceCountry: "Bahrain" },
  { url: "https://www.tamkeen.bh/news/feed/",                        sourceName: "Tamkeen Bahrain",       isTrustedGCC: true,  forceCountry: "Bahrain" },
  { url: "https://www.qstp.org.qa/news/feed/",                       sourceName: "QSTP Qatar",            isTrustedGCC: true,  forceCountry: "Qatar" },
  { url: "https://otf.om/feed/",                                     sourceName: "Oman Technology Fund",  isTrustedGCC: true,  forceCountry: "Oman" },
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

const STARTUP_KEYWORDS = [
  "startup", "startups", "founder", "co-founder", "cofounder", "entrepreneur", "entrepreneurship",
  "funding", "funded", "investment", "investor", "venture capital", "vc fund",
  "seed round", "pre-seed", "series a", "series b", "series c", "series d",
  "raise", "raised", "grant", "equity", "capital",
  "accelerator", "incubator", "cohort", "batch", "demo day", "program",
  "call for startups", "applications open", "apply now", "launchpad",
  "launch", "launches", "launched", "unveiled", "product launch", "goes live",
  "acquisition", "acquires", "acquired", "merger", "ipo", "listing", "exit",
  "unicorn", "valuation", "scale-up", "scaleup",
  "fintech", "healthtech", "edtech", "proptech", "agritech", "saas", "deeptech",
  "web3", "ai startup", "tech company", "tech startup",
  "innovation", "ecosystem", "hub71", "flat6labs", "taqadam", "misk hub",
  "pitch", "pitching", "hackathon", "demo", "startup competition",
];

function isGCCRelevant(text: string): boolean {
  return GCC_TERMS.some((t) => text.toLowerCase().includes(t));
}

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

// ─── Auto-cleanup ─────────────────────────────────────────────────────────────
// IMPORTANT: Uses created_at (when WE stored it) NOT published_at (the feed's
// date). This prevents freshly-inserted articles being immediately pruned
// because their RSS pubDate happens to be older than 30 days.
async function pruneOldArticles(): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    await db.execute(sql`
      DELETE FROM articles
      WHERE is_featured = false
        AND created_at < ${cutoff.toISOString()}
    `);
    logger.info({ cutoff: cutoff.toISOString() }, "Pruned articles older than 30 days (by created_at)");

    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM articles`);
    const total = Number(countResult[0]?.count ?? 0);
    const MAX_ARTICLES = 500;
    if (total > MAX_ARTICLES) {
      const deleteCount = total - MAX_ARTICLES;
      await db.execute(sql`
        DELETE FROM articles WHERE id IN (
          SELECT id FROM articles WHERE is_featured = false
          ORDER BY created_at ASC LIMIT ${deleteCount}
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
  thumbnail?:       string;
  enclosure?:       Rss2JsonEnclosure;
  "media:content"?: { url?: string };
}

interface Rss2JsonResponse {
  status: string;
  feed?: { image?: string };
  items: Rss2JsonItem[];
}

interface NormalizedItem {
  title:       string;
  link:        string;
  pubDate:     string;
  description: string;
  content:     string;
  imageUrl:    string | null;
}

function extractImageFromHtml(html: string): string | null {
  if (!html) return null;
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1] && imgMatch[1].startsWith("http")) return imgMatch[1];
  const dataSrcMatch = html.match(/<img[^>]+data-src=["']([^"']+)["']/i);
  if (dataSrcMatch?.[1] && dataSrcMatch[1].startsWith("http")) return dataSrcMatch[1];
  const srcsetMatch = html.match(/srcset=["']([^"'\s,]+)/i);
  if (srcsetMatch?.[1] && srcsetMatch[1].startsWith("http")) return srcsetMatch[1];
  const ogMatch = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1] && ogMatch[1].startsWith("http")) return ogMatch[1];
  const mediaMatch = html.match(/media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch?.[1] && mediaMatch[1].startsWith("http")) return mediaMatch[1];
  return null;
}

function extractImageUrl(item: Rss2JsonItem): string | null {
  if (item.thumbnail && item.thumbnail.startsWith("http")) return item.thumbnail;
  const enc = item.enclosure;
  if (enc) {
    const encUrl = enc.link || enc.url;
    if (encUrl && encUrl.startsWith("http") && (enc.type?.startsWith("image") || /\.(jpe?g|png|webp|gif)/i.test(encUrl))) {
      return encUrl;
    }
  }
  return extractImageFromHtml(item.content || item.description || "");
}

async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ArabianStartupsBot/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ogA = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogA?.[1]?.startsWith("http")) return ogA[1];
    const ogB = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogB?.[1]?.startsWith("http")) return ogB[1];
    const ogNameA = html.match(/<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogNameA?.[1]?.startsWith("http")) return ogNameA[1];
    const ogNameB = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']og:image["']/i);
    if (ogNameB?.[1]?.startsWith("http")) return ogNameB[1];
    const twA = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (twA?.[1]?.startsWith("http")) return twA[1];
    const twB = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twB?.[1]?.startsWith("http")) return twB[1];
    const bodyMatch = html.match(/<article[\s\S]*?<\/article>/i) || html.match(/<main[\s\S]*?<\/main>/i);
    const body = bodyMatch?.[0] ?? html;
    const imgTags = body.match(/<img[^>]+>/gi) ?? [];
    for (const tag of imgTags) {
      const srcMatch = tag.match(/(?:data-)?src=["']([^"']+)["']/i);
      const src = srcMatch?.[1];
      if (!src || !src.startsWith("http")) continue;
      if (/logo|icon|avatar|spacer|pixel|sprite|\.svg(\?|$)/i.test(src)) continue;
      const widthMatch = tag.match(/width=["']?(\d+)/i);
      if (widthMatch && Number(widthMatch[1]) < 200) continue;
      return src;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchFeedViaProxy(feedUrl: string): Promise<NormalizedItem[]> {
  const apiKey = process.env.RSS2JSON_API_KEY ?? "";
  const keyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "";
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=20${keyParam}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`rss2json returned ${res.status}`);
  const data = await res.json() as Rss2JsonResponse;
  if (data.status !== "ok") throw new Error(`rss2json status: ${data.status}`);
  return (data.items ?? []).map((item) => ({
    title:       item.title ?? "",
    link:        item.link ?? "",
    pubDate:     item.pubDate ?? "",
    description: item.description ?? "",
    content:     item.content ?? "",
    imageUrl:    extractImageUrl(item),
  }));
}

function sanitizeFeedXml(xml: string): string {
  return xml
    .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/g, "&amp;")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

const directParser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  xml2js: {
    strict: false,
    normalize: true,
  },
});

async function fetchFeedDirect(feedUrl: string): Promise<NormalizedItem[]> {
  const res = await fetch(feedUrl, {
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${feedUrl}`);
  const rawXml = await res.text();
  const cleanXml = sanitizeFeedXml(rawXml);
  const feed = await directParser.parseString(cleanXml);

  return (feed.items ?? []).slice(0, 20).map((item) => {
    const raw = item as unknown as Record<string, unknown>;
    const contentEncoded = typeof raw["content:encoded"] === "string" ? raw["content:encoded"] as string : undefined;
    const description = item.summary || item.contentSnippet || item.content || "";
    const content     = item.content || contentEncoded || description;
    let imageUrl: string | null = null;
    const enc = item.enclosure;
    if (enc?.url && enc.url.startsWith("http") && (enc.type?.startsWith("image") || /\.(jpe?g|png|webp|gif)/i.test(enc.url))) {
      imageUrl = enc.url;
    }
    if (!imageUrl) {
      const mediaContent = raw["media:content"] as { $?: { url?: string } } | undefined;
      const mediaUrl = mediaContent?.$?.url;
      if (mediaUrl && mediaUrl.startsWith("http")) imageUrl = mediaUrl;
    }
    if (!imageUrl) imageUrl = extractImageFromHtml(content || description);
    return {
      title:       item.title ?? "",
      link:        item.link ?? "",
      pubDate:     item.pubDate || item.isoDate || "",
      description,
      content,
      imageUrl,
    };
  });
}

async function fetchFeedItems(feed: Feed): Promise<NormalizedItem[]> {
  if (!feed.proxyOnly) {
    try {
      return await fetchFeedDirect(feed.url);
    } catch (directErr) {
      logger.warn({ err: directErr, feed: feed.url }, "Direct XML fetch failed — falling back to rss2json proxy");
    }
  }
  try {
    return await fetchFeedViaProxy(feed.url);
  } catch (proxyErr) {
    logger.warn({ err: proxyErr, feed: feed.url }, "rss2json fallback also failed");
    throw proxyErr;
  }
}

// ─── Feed Fetcher ─────────────────────────────────────────────────────────────
export async function fetchAndStoreFeed(feed: Feed): Promise<{ inserted: number; error: string | null }> {
  let inserted = 0;
  try {
    const items = await fetchFeedItems(feed);

    // Articles older than 30 days would be pruned immediately — skip them
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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

      // ── Skip articles older than 30 days — they'd be pruned immediately ────
      if (publishedAt < thirtyDaysAgo) continue;

      const combined = `${title} ${summary}`;
      if (!feed.isTrustedGCC && !isGCCRelevant(combined)) continue;
      if (!isStartupRelevant(combined)) continue;

      const existing = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(eq(articlesTable.sourceUrl, sourceUrl))
        .limit(1);
      if (existing.length > 0) continue;

      const country  = detectCountry(combined, feed.forceCountry);
      const category = detectCategory(combined);

      let imageUrl = item.imageUrl;
      if (!imageUrl && sourceUrl) {
        imageUrl = await fetchOgImage(sourceUrl);
      }

      await db.insert(articlesTable).values({
        title:      title.slice(0, 500),
        summary:    (summary || title).slice(0, 1000),
        sourceUrl,
        sourceName: feed.sourceName,
        imageUrl:   imageUrl ?? null,
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
    return { inserted, error: null };
  } catch (err) {
    logger.warn({ err, feed: feed.url }, "Failed to fetch feed");
    return { inserted, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Daily Run ────────────────────────────────────────────────────────────────
export async function runDailyFetch(): Promise<void> {
  logger.info("Starting daily news fetch");
  const startedAt = new Date();
  let total = 0;
  const feedStats: Record<string, FeedRunStat> = {};

  for (const feed of FEEDS) {
    const { inserted, error } = await fetchAndStoreFeed(feed);
    total += inserted;
    feedStats[feed.sourceName] = { inserted, error };
    await new Promise((r) => setTimeout(r, 1100));
  }
  logger.info({ total }, "Daily fetch complete");

  try {
    await pruneOldArticles();
    await db.execute(
      sql`UPDATE categories c SET article_count = sub.cnt FROM
          (SELECT category, COUNT(*) as cnt FROM articles GROUP BY category) sub
          WHERE c.name = sub.category`
    );
    await generateDailyDigest();

    await db.insert(fetchRunsTable).values({
      startedAt,
      finishedAt:       new Date(),
      success:          true,
      articlesInserted: total,
      feedStats,
      error:            null,
    });
  } catch (err) {
    logger.error({ err }, "Daily fetch post-processing failed");
    try {
      await db.insert(fetchRunsTable).values({
        startedAt,
        finishedAt:       new Date(),
        success:          false,
        articlesInserted: total,
        feedStats,
        error:            err instanceof Error ? err.message : String(err),
      });
    } catch (recordErr) {
      logger.warn({ err: recordErr }, "Failed to record failed fetch run");
    }
    throw err;
  }

  await logDeadFeedsWeekly();
}

// ─── Weekly feed-health summary ───────────────────────────────────────────────
async function logDeadFeedsWeekly(): Promise<void> {
  if (new Date().getUTCDay() !== 0) return;
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const runs = await db
      .select({ feedStats: fetchRunsTable.feedStats })
      .from(fetchRunsTable)
      .where(gte(fetchRunsTable.startedAt, since));
    const totals: Record<string, { inserted: number; errors: number }> = {};
    for (const feed of FEEDS) totals[feed.sourceName] = { inserted: 0, errors: 0 };
    for (const run of runs) {
      const stats = run.feedStats ?? {};
      for (const [feedName, stat] of Object.entries(stats)) {
        if (!totals[feedName]) totals[feedName] = { inserted: 0, errors: 0 };
        totals[feedName]!.inserted += stat.inserted;
        if (stat.error) totals[feedName]!.errors += 1;
      }
    }
    const deadFeeds = Object.entries(totals)
      .filter(([, t]) => t.inserted === 0)
      .map(([name, t]) => ({ feed: name, errors: t.errors }));
    logger.info({ totals, runsConsidered: runs.length }, "Weekly feed-health summary");
    if (deadFeeds.length > 0) {
      logger.warn({ deadFeeds }, "Feeds with zero inserts in the last 7 days");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to compute weekly feed-health summary");
  }
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
