import Parser from "rss-parser";
import { db, articlesTable, digestsTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { logger } from "./logger";

const parser = new Parser({
  timeout: 12000,
  headers: { "User-Agent": "ArabianStartupsEcosystem/1.0 (+https://arabianstartups.com)" },
});

interface Feed {
  url: string;
  sourceName: string;
  /** If true, every article from this feed is treated as GCC-relevant — no keyword filter */
  isTrustedGCC?: boolean;
  /** Override country for all articles from this feed */
  forceCountry?: string;
}

// ─── RSS Feeds ────────────────────────────────────────────────────────────────
const FEEDS: Feed[] = [
  // ── General GCC startup & business news ────────────────────────────────────
  { url: "https://wamda.com/feed",                                  sourceName: "Wamda" },
  { url: "https://menabytes.com/feed/",                             sourceName: "MENAbytes" },
  { url: "https://techcrunch.com/tag/middle-east/feed/",            sourceName: "TechCrunch MENA" },
  { url: "https://techcrunch.com/tag/saudi-arabia/feed/",           sourceName: "TechCrunch Saudi" },
  { url: "https://techcrunch.com/tag/dubai/feed/",                  sourceName: "TechCrunch Dubai" },
  { url: "https://www.entrepreneur.com/en-ae/rss",                  sourceName: "Entrepreneur ME" },
  { url: "https://forbesmiddleeast.com/feed/",                      sourceName: "Forbes Middle East" },
  { url: "https://gulfbusiness.com/feed/",                          sourceName: "Gulf Business" },
  { url: "https://www.arabianbusiness.com/rss",                     sourceName: "Arabian Business" },
  { url: "https://www.zawya.com/en/rss/startups",                   sourceName: "Zawya Startups" },
  { url: "https://startupbahrain.com/feed/",                        sourceName: "Startup Bahrain", isTrustedGCC: true, forceCountry: "Bahrain" },
  { url: "https://www.khaleejtimes.com/feed/business",              sourceName: "Khaleej Times" },
  { url: "https://sifted.eu/rss",                                   sourceName: "Sifted" },

  // ── Saudi Arabia-specific ───────────────────────────────────────────────────
  { url: "https://www.arabnews.com/taxonomy/term/10251/feed",       sourceName: "Arab News Business" },
  { url: "https://www.arabnews.com/taxonomy/term/4022/feed",        sourceName: "Arab News Tech" },
  { url: "https://www.spa.gov.sa/rss/en",                           sourceName: "Saudi Press Agency", isTrustedGCC: true, forceCountry: "Saudi Arabia" },

  // ── Incubators & Accelerators — GCC-native sources ──────────────────────────
  { url: "https://hub71.com/news/feed/",                            sourceName: "Hub71", isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://flat6labs.com/blog/feed/",                        sourceName: "Flat6Labs", isTrustedGCC: true },
  { url: "https://500.co/feed/",                                    sourceName: "500 Global" },
  { url: "https://astrolabs.com/blog/feed/",                        sourceName: "AstroLabs", isTrustedGCC: true },
  { url: "https://www.in5.ae/news/feed/",                           sourceName: "In5 Dubai", isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://dtec.ae/feed/",                                   sourceName: "Dtec Dubai Silicon Oasis", isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://founders.ae/feed/",                               sourceName: "Founders Diwan UAE", isTrustedGCC: true, forceCountry: "UAE" },
  { url: "https://www.badir.com.sa/feed",                           sourceName: "Badir Program KACST", isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://www.taqadam.org/feed/",                           sourceName: "TAQADAM KAUST", isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://miskhub.com/feed/",                               sourceName: "Misk Hub", isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://waed.com/feed/",                                  sourceName: "Wa'ed Aramco Ventures", isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://monshaat.gov.sa/en/rss.xml",                      sourceName: "Monsha'at", isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://saudistartups.org/feed/",                         sourceName: "Saudi Startups", isTrustedGCC: true, forceCountry: "Saudi Arabia" },
  { url: "https://www.startupgrind.com/blog/feed/?tag=saudi",       sourceName: "Startup Grind Saudi" },
  { url: "https://www.startupgrind.com/blog/feed/?tag=dubai",       sourceName: "Startup Grind Dubai" },
  { url: "https://www.qstp.org.qa/news/feed/",                      sourceName: "QSTP Qatar", isTrustedGCC: true, forceCountry: "Qatar" },
  { url: "https://www.tamkeen.bh/news/feed/",                       sourceName: "Tamkeen Bahrain", isTrustedGCC: true, forceCountry: "Bahrain" },
  { url: "https://otf.om/feed/",                                    sourceName: "Oman Technology Fund", isTrustedGCC: true, forceCountry: "Oman" },
  { url: "https://www.brinc.io/blog/rss.xml",                       sourceName: "Brinc Accelerator" },
];

// ─── Country Detection ────────────────────────────────────────────────────────
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  "Saudi Arabia": [
    "saudi", "ksa", "riyadh", "jeddah", "dammam", "mecca", "medina",
    "aramco", "sabic", "vision 2030", "neom", "pif", "svc", "monshaat",
    "wa'ed", "waed", "badir", "kacst", "taqadam", "misk", "impact46",
    "raed ventures", "seedra", "hala ventures", "stc ventures", "elm company",
    "spark", "sadara", "saudi telecom",
  ],
  UAE: [
    "uae", "dubai", "abu dhabi", "sharjah", "ajman", "ras al khaimah",
    "emirati", "difc", "adgm", "adq", "mubadala", "hub71", "area 2071",
    "startad", "in5", "dtec", "astrolabs", "twofour54", "turn8", "brinc",
    "silicon oasis", "tecom", "gitex",
  ],
  Kuwait: ["kuwait", "kuwaiti", "kuwait city", "boursa kuwait", "kfas"],
  Qatar: ["qatar", "doha", "qatari", "qia", "qstp", "qfc", "lusail", "sidra"],
  Bahrain: ["bahrain", "manama", "bahraini", "cbb", "tamkeen", "bahrain bay", "fintech bay"],
  Oman: ["oman", "muscat", "omani", "otf", "oman technology fund", "barka"],
};

// ─── Category Detection ───────────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Incubators & Accelerators": [
    "incubator", "accelerator", "acceleration program", "cohort", "batch",
    "startup program", "demo day", "hub71", "flat6labs", "taqadam", "misk hub",
    "badir", "wa'ed", "waed", "in5", "dtec", "astrolabs", "brinc", "turn8",
    "monsha'at", "tamkeen", "otf", "qstp", "startad", "twofour54", "area 2071",
    "founders factory", "500 startups", "500 global", "y combinator", "techstars",
    "plug and play", "startup studio", "venture studio", "pre-seed program",
    "sbc", "saudi business center", "entrepreneur program", "bootcamp",
    "startup weekend", "startup grind", "launch pad",
  ],
  Funding: [
    "raise", "raised", "funding", "series a", "series b", "series c", "series d",
    "investment", "venture capital", "seed round", "pre-seed", "million", "billion",
    "capital", "backed", "investor", "angel", "grant", "equity", "vc fund",
  ],
  Acquisitions: [
    "acqui", "merger", "bought", "purchase", "takeover", "stake",
    "acquires", "acquired", "m&a", "exit", "buyout",
  ],
  Launches: [
    "launch", "launches", "unveiled", "introduces", "announces new", "new product",
    "debut", "rollout", "goes live", "open for applications", "applications open",
  ],
  Policy: [
    "regulation", "regulatory", "government", "ministry", "law", "license",
    "licensed", "central bank", "vision 2030", "initiative", "policy",
    "national strategy", "royal decree", "cabinet",
  ],
  People: [
    "ceo", "founder", "appoints", "joins", "hired", "promoted",
    "leadership", "executive", "co-founder", "managing director", "named as",
  ],
  Growth: [
    "milestone", "expands", "expansion", "growth", "revenue", "users",
    "customers", "ipo", "listing", "unicorn", "valuation", "profitability",
  ],
  Technology: [
    "ai", "artificial intelligence", "machine learning", "blockchain", "fintech",
    "saas", "cloud", "platform", "digital", "software", "app", "deeptech",
    "cybersecurity", "healthtech", "edtech", "proptech", "agritech",
  ],
  Ecosystem: [
    "event", "summit", "conference", "partnership", "collaboration",
    "ecosystem", "community", "hub", "report", "index", "ranking",
  ],
};

// ─── GCC Relevance ────────────────────────────────────────────────────────────
const GCC_TERMS = [
  "saudi", "uae", "dubai", "abu dhabi", "kuwait", "qatar", "bahrain", "oman",
  "gulf", "gcc", "mena", "middle east", "arab", "riyadh", "doha", "manama",
  "muscat", "sharjah", "ajman", "ksa", "neom", "vision 2030",
  // GCC incubator names are inherently regional
  "hub71", "flat6labs", "taqadam", "misk", "badir", "wa'ed", "waed", "in5",
  "dtec", "astrolabs", "tamkeen", "qstp", "monsha'at", "monshaat", "otf",
];

function isGCCRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return GCC_TERMS.some((t) => lower.includes(t));
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

// ─── Feed Fetcher ─────────────────────────────────────────────────────────────
export async function fetchAndStoreFeed(feed: Feed): Promise<number> {
  let inserted = 0;
  try {
    const parsed = await parser.parseURL(feed.url);
    for (const item of parsed.items ?? []) {
      const title = item.title ?? "";
      const summary = item.contentSnippet ?? item.summary ?? item.content ?? "";
      const sourceUrl = item.link ?? "";
      const rawDate = item.pubDate ? new Date(item.pubDate) : null;
      const publishedAt = rawDate && !isNaN(rawDate.getTime()) ? rawDate : new Date();

      if (!title || !sourceUrl) continue;

      const combined = `${title} ${summary}`;

      // Trusted GCC sources skip the keyword filter
      if (!feed.isTrustedGCC && !isGCCRelevant(combined)) continue;

      // Deduplicate by source URL
      const existing = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(eq(articlesTable.sourceUrl, sourceUrl))
        .limit(1);

      if (existing.length > 0) continue;

      const country = detectCountry(combined, feed.forceCountry);
      const category = detectCategory(combined);

      await db.insert(articlesTable).values({
        title: title.slice(0, 500),
        summary: (summary || title).slice(0, 1000),
        sourceUrl,
        sourceName: feed.sourceName,
        category,
        country,
        tags: [],
        isFeatured: false,
        viewCount: 0,
        publishedAt,
      });

      inserted++;
    }
  } catch (err) {
    logger.warn({ err, feed: feed.url }, "Failed to fetch RSS feed");
  }
  return inserted;
}

// ─── Daily Run ────────────────────────────────────────────────────────────────
export async function runDailyFetch(): Promise<void> {
  logger.info("Starting daily news fetch");
  let total = 0;
  for (const feed of FEEDS) {
    const count = await fetchAndStoreFeed(feed);
    if (count > 0) {
      logger.info({ feed: feed.sourceName, inserted: count }, "Feed processed");
    }
    total += count;
  }
  logger.info({ total }, "Daily news fetch complete");

  // Refresh category article counts
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
    logger.info("No articles today — skipping digest generation");
    return;
  }

  const highlights = todaysArticles.slice(0, 6).map((a) => {
    const truncated = a.summary.length > 90 ? a.summary.slice(0, 87) + "…" : a.summary;
    return `${a.country}: ${truncated}`;
  });

  const categories = [...new Set(todaysArticles.map((a) => a.category))];
  const countryCounts: Record<string, number> = {};
  for (const a of todaysArticles) {
    countryCounts[a.country] = (countryCounts[a.country] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c)
    .join(", ");

  const incubatorCount = todaysArticles.filter(
    (a) => a.category === "Incubators & Accelerators"
  ).length;

  const incubatorNote =
    incubatorCount > 0
      ? ` Incubator and accelerator activity featured ${incubatorCount} stories today.`
      : "";

  const summary =
    `Today's GCC startup ecosystem digest covers ${todaysArticles.length} stories across ${categories.length} categories. ` +
    `Top coverage from: ${topCountries}.` +
    incubatorNote +
    ` Key themes include ${categories.slice(0, 4).join(", ")} news from across the Arabian Gulf.`;

  const existing = await db
    .select()
    .from(digestsTable)
    .where(eq(digestsTable.date, dateStr))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(digestsTable)
      .set({ summary, highlights, articleCount: todaysArticles.length })
      .where(eq(digestsTable.date, dateStr));
  } else {
    await db.insert(digestsTable).values({
      date: dateStr,
      summary,
      highlights,
      articleCount: todaysArticles.length,
    });
  }

  logger.info({ date: dateStr, articles: todaysArticles.length }, "Daily digest generated");
}
