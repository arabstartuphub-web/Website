import Parser from "rss-parser";
import { db, articlesTable, digestsTable, categoriesTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { logger } from "./logger";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "ArabianStartupsEcosystem/1.0 (news aggregator)" },
});

// RSS feeds covering GCC startup & business news
const FEEDS = [
  // Saudi / GCC focused
  { url: "https://wamda.com/feed", sourceName: "Wamda" },
  { url: "https://magnitt.com/feed", sourceName: "Magnitt" },
  { url: "https://www.arabnews.com/taxonomy/term/10251/feed", sourceName: "Arab News Business" },
  { url: "https://gulfnews.com/rss/business", sourceName: "Gulf News Business" },
  { url: "https://www.thenationalnews.com/rss/business/technology/", sourceName: "The National Tech" },
  { url: "https://startupbahrain.com/feed/", sourceName: "Startup Bahrain" },
  { url: "https://www.khaleejtimes.com/feed/business", sourceName: "Khaleej Times Business" },
  { url: "https://www.zawya.com/en/rss/business-economy", sourceName: "Zawya" },
  { url: "https://techcrunch.com/tag/middle-east/feed/", sourceName: "TechCrunch MENA" },
  { url: "https://www.entrepreneur.com/en-ae/rss", sourceName: "Entrepreneur ME" },
];

// Keywords for country detection
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  "Saudi Arabia": ["saudi", "ksa", "riyadh", "jeddah", "aramco", "sabic", "vision 2030", "neom", "pif", "svc", "monshaat"],
  UAE: ["uae", "dubai", "abu dhabi", "sharjah", "emirati", "difc", "adgm", "adq", "mubadala"],
  Kuwait: ["kuwait", "kuwaiti", "kuwait city"],
  Qatar: ["qatar", "doha", "qatari", "qia"],
  Bahrain: ["bahrain", "manama", "bahraini", "cbb", "tamkeen"],
  Oman: ["oman", "muscat", "omani", "otf"],
};

// Keywords for category detection
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Funding: ["raise", "raised", "funding", "series a", "series b", "series c", "investment", "venture", "seed round", "million", "billion", "capital", "backed", "investor"],
  Acquisitions: ["acqui", "merger", "bought", "purchase", "takeover", "stake", "acquires", "acquired"],
  Launches: ["launch", "launches", "unveiled", "introduces", "announces new", "new product", "debut", "rollout", "goes live"],
  Policy: ["regulation", "regulatory", "government", "ministry", "law", "license", "licensed", "central bank", "vision 2030", "initiative", "policy"],
  People: ["ceo", "founder", "appoints", "joins", "hired", "promoted", "leadership", "executive", "co-founder"],
  Growth: ["milestone", "expands", "expansion", "growth", "revenue", "users", "customers", "ipo", "listing", "unicorn"],
  Technology: ["ai", "artificial intelligence", "blockchain", "fintech", "saas", "cloud", "platform", "digital", "tech", "software", "app"],
  Ecosystem: ["accelerator", "incubator", "hub", "ecosystem", "community", "event", "summit", "conference", "partnership", "collaboration"],
};

function detectCountry(text: string): string {
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

function isGCCRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  const gccTerms = [
    "saudi", "uae", "dubai", "abu dhabi", "kuwait", "qatar", "bahrain", "oman",
    "gulf", "gcc", "mena", "middle east", "arab", "riyadh", "doha", "manama",
    "muscat", "sharjah", "ajman",
  ];
  return gccTerms.some((t) => lower.includes(t));
}

export async function fetchAndStoreFeed(feed: { url: string; sourceName: string }): Promise<number> {
  let inserted = 0;
  try {
    const parsed = await parser.parseURL(feed.url);
    for (const item of parsed.items ?? []) {
      const title = item.title ?? "";
      const summary = item.contentSnippet ?? item.summary ?? item.content ?? "";
      const sourceUrl = item.link ?? "";
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      if (!title || !sourceUrl) continue;

      const combined = `${title} ${summary}`;
      if (!isGCCRelevant(combined)) continue;

      // Check for duplicate
      const existing = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(eq(articlesTable.sourceUrl, sourceUrl))
        .limit(1);

      if (existing.length > 0) continue;

      const country = detectCountry(combined);
      const category = detectCategory(combined);

      await db.insert(articlesTable).values({
        title: title.slice(0, 500),
        summary: summary.slice(0, 1000) || title,
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

export async function runDailyFetch(): Promise<void> {
  logger.info("Starting daily news fetch");
  let total = 0;
  for (const feed of FEEDS) {
    const count = await fetchAndStoreFeed(feed);
    logger.info({ feed: feed.sourceName, inserted: count }, "Feed processed");
    total += count;
  }
  logger.info({ total }, "Daily news fetch complete");

  // Update category article counts
  await db.execute(
    sql`UPDATE categories c SET article_count = sub.cnt FROM
        (SELECT category, COUNT(*) as cnt FROM articles GROUP BY category) sub
        WHERE c.name = sub.category`
  );

  await generateDailyDigest();
}

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

  // Build highlights from top articles
  const highlights = todaysArticles.slice(0, 6).map((a) => {
    const truncated = a.summary.length > 90 ? a.summary.slice(0, 87) + "…" : a.summary;
    return `${a.country}: ${truncated}`;
  });

  // Build summary from category breakdown
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

  const summary =
    `Today's GCC startup ecosystem digest covers ${todaysArticles.length} stories across ${categories.length} categories. ` +
    `Top coverage from: ${topCountries}. ` +
    `Key themes include ${categories.slice(0, 4).join(", ")} news from across the Arabian Gulf.`;

  // Upsert digest for today
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
