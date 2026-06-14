/**
 * One-off migration: retroactively re-run category/country detection over
 * existing articles.
 *
 * detectCategory()/detectCountry() in artifacts/api-server/src/lib/news-scraper.ts
 * run once at insert time — if you tune CATEGORY_KEYWORDS or COUNTRY_KEYWORDS,
 * existing articles keep their old (now possibly wrong) classification until
 * they age out (30 days / 300-article cap). Run this script after changing
 * those keyword lists to reclassify everything currently in the DB.
 *
 * IMPORTANT: The keyword maps below are copied from news-scraper.ts. If you
 * change the keyword lists there, update them here too (or, if this script
 * gets used often, consider exporting the maps + detect functions from
 * news-scraper.ts instead of duplicating them).
 *
 * NOTE: news-scraper.ts also applies a per-feed `forceCountry` override
 * (e.g. all TechCrunch Saudi articles are forced to "Saudi Arabia" regardless
 * of keywords). This script has no record of which feed an article came from,
 * so it can only reclassify by keyword. Articles whose country was originally
 * set via forceCountry may get reclassified to a keyword-derived country here
 * — review the diff before applying if that matters to you.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run reclassify          # dry run, prints changes
 *   pnpm --filter @workspace/scripts run reclassify -- --apply   # writes changes
 *
 * Requires DATABASE_URL to be set (same as the API server).
 */
import { db, articlesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

// ─── Keep these in sync with artifacts/api-server/src/lib/news-scraper.ts ────
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

async function main() {
  const apply = process.argv.includes("--apply");

  const articles = await db
    .select({
      id: articlesTable.id,
      title: articlesTable.title,
      summary: articlesTable.summary,
      category: articlesTable.category,
      country: articlesTable.country,
    })
    .from(articlesTable);

  let changed = 0;
  for (const article of articles) {
    const combined = `${article.title} ${article.summary}`;
    const newCategory = detectCategory(combined);
    const newCountry = detectCountry(combined);

    const categoryChanged = newCategory !== article.category;
    const countryChanged = newCountry !== article.country;

    if (!categoryChanged && !countryChanged) continue;
    changed++;

    console.log(
      `#${article.id} "${article.title.slice(0, 60)}..."` +
        (categoryChanged ? `  category: ${article.category} -> ${newCategory}` : "") +
        (countryChanged ? `  country: ${article.country} -> ${newCountry}` : "")
    );

    if (apply) {
      await db
        .update(articlesTable)
        .set({ category: newCategory, country: newCountry })
        .where(sql`${articlesTable.id} = ${article.id}`);
    }
  }

  console.log(`\n${changed} of ${articles.length} articles would change.`);
  if (!apply) {
    console.log("Dry run only — re-run with `-- --apply` to write changes.");
  } else {
    // Recompute category article_count after bulk reclassification
    await db.execute(
      sql`UPDATE categories c SET article_count = sub.cnt FROM
          (SELECT category, COUNT(*) as cnt FROM articles GROUP BY category) sub
          WHERE c.name = sub.category`
    );
    console.log("Applied changes and refreshed category counts.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
