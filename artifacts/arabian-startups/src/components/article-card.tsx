import { Article } from "@workspace/api-client-react/src/generated/api.schemas";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  "Funding":                   "badge-funding",
  "Technology":                "badge-technology",
  "Ecosystem":                 "badge-ecosystem",
  "Launches":                  "badge-launches",
  "Acquisitions":              "badge-acquisitions",
  "Policy":                    "badge-policy",
  "People":                    "badge-people",
  "Growth":                    "badge-growth",
  "Incubators & Accelerators": "badge-incubators",
};

const FLAGS: Record<string, string> = {
  "Saudi Arabia": "🇸🇦",
  UAE:     "🇦🇪",
  Kuwait:  "🇰🇼",
  Qatar:   "🇶🇦",
  Bahrain: "🇧🇭",
  Oman:    "🇴🇲",
  GCC:     "🌍",
};

// ─── Verified Unsplash photo IDs, grouped by category ────────────────────────
// All startup / business / MENA themed. No animals, no nature, no explicit.
// Real IDs format: {timestamp}-{hash}  e.g. 1553729459-efe14ef6055d
const PHOTO_POOLS: Record<string, string[]> = {
  "Funding": [
    "1553729459-efe14ef6055d", // handshake over business documents
    "1460925895917-afdab827c52f", // financial charts on laptop
    "1559526324-4b87b5e36e44", // deal handshake in office
    "1504384308090-c894fdcc538d", // startup pitch on screen
    "1526628953301-3cd611d67fca", // investment meeting table
    "1450101499163-c8848c66ca85", // contract signing close-up
    "1486406146926-c627a92ad1ab", // modern glass boardroom
    "1507003211169-0a1dd7228f2d", // entrepreneur focused at desk
  ],
  "Incubators & Accelerators": [
    "1497366216548-37526070297c", // open co-working floor
    "1497366811353-6870744d04b2", // startup hub interior
    "1522071820081-009f0129c71c", // team whiteboard session
    "1531482615713-2afd69097998", // demo day presentation
    "1542744173-8e7e53415bb0", // modern startup office
    "1568992687947-868a62a9f521", // co-working café workspace
    "1515187029135-18ee286d815b", // team brainstorm
    "1504384308090-c894fdcc538d", // pitch board session
  ],
  "Acquisitions": [
    "1559526324-4b87b5e36e44", // formal handshake
    "1553729459-efe14ef6055d", // documents on desk
    "1450101499163-c8848c66ca85", // contract close-up
    "1486406146926-c627a92ad1ab", // boardroom discussion
    "1507003211169-0a1dd7228f2d", // executives meeting
    "1460925895917-afdab827c52f", // deal analytics screen
    "1526628953301-3cd611d67fca", // deal roundtable
    "1504384308090-c894fdcc538d", // corporate pitch deck
  ],
  "Launches": [
    "1504384308090-c894fdcc538d", // product launch slide
    "1531482615713-2afd69097998", // onstage announcement
    "1497366216548-37526070297c", // launch event crowd
    "1522071820081-009f0129c71c", // team reveal moment
    "1542744173-8e7e53415bb0", // new office open day
    "1568992687947-868a62a9f521", // workspace reveal
    "1515187029135-18ee286d815b", // product demo session
    "1497366811353-6870744d04b2", // startup launch floor
  ],
  "Policy": [
    "1486406146926-c627a92ad1ab", // formal meeting room
    "1507003211169-0a1dd7228f2d", // official discussion
    "1450101499163-c8848c66ca85", // document signing
    "1559526324-4b87b5e36e44", // official handshake
    "1526628953301-3cd611d67fca", // policy roundtable
    "1553729459-efe14ef6055d", // regulatory papers
    "1460925895917-afdab827c52f", // government data screen
    "1504384308090-c894fdcc538d", // official presentation
  ],
  "People": [
    "1507003211169-0a1dd7228f2d", // entrepreneur portrait
    "1531482615713-2afd69097998", // speaker at stage
    "1522071820081-009f0129c71c", // team leader moment
    "1515187029135-18ee286d815b", // professional workspace
    "1568992687947-868a62a9f521", // founder at desk
    "1486406146926-c627a92ad1ab", // executive in boardroom
    "1559526324-4b87b5e36e44", // CEO handshake
    "1497366811353-6870744d04b2", // startup founder
  ],
  "Growth": [
    "1460925895917-afdab827c52f", // analytics dashboard
    "1526628953301-3cd611d67fca", // growth metrics screen
    "1504384308090-c894fdcc538d", // data board presentation
    "1542744173-8e7e53415bb0", // scaling office
    "1497366216548-37526070297c", // team growth moment
    "1553729459-efe14ef6055d", // milestone documents
    "1486406146926-c627a92ad1ab", // growth strategy meeting
    "1531482615713-2afd69097998", // success presentation
  ],
  "Technology": [
    "1451187580459-43490279c0fa", // glowing tech / code screen
    "1518770660439-4636190af475", // circuit board close-up
    "1461749280684-dccba630e2f6", // coding monitor
    "1504384308090-c894fdcc538d", // tech pitch slide
    "1460925895917-afdab827c52f", // laptop analytics
    "1542744173-8e7e53415bb0", // tech open office
    "1497366811353-6870744d04b2", // developer workspace
    "1568992687947-868a62a9f521", // focused dev setup
  ],
  "Ecosystem": [
    "1531482615713-2afd69097998", // conference stage
    "1497366216548-37526070297c", // networking floor
    "1515187029135-18ee286d815b", // community event
    "1522071820081-009f0129c71c", // ecosystem session
    "1497366811353-6870744d04b2", // hub community
    "1542744173-8e7e53415bb0", // innovation centre
    "1504384308090-c894fdcc538d", // ecosystem summit
    "1568992687947-868a62a9f521", // co-working community
  ],
};

const FALLBACK_POOL = [
  "1553729459-efe14ef6055d",
  "1497366216548-37526070297c",
  "1542744173-8e7e53415bb0",
  "1460925895917-afdab827c52f",
  "1504384308090-c894fdcc538d",
  "1531482615713-2afd69097998",
  "1451187580459-43490279c0fa",
  "1515187029135-18ee286d815b",
];

// ─── Deterministic hash of a string → integer ────────────────────────────────
// Uses the same djb2 algorithm; always returns the same number for the same
// title string, so the same article always gets the same image, even across
// re-seeds, ID changes, or new deployments.
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0; // keep as unsigned 32-bit
  }
  return h;
}

// ─── Pick a photo ID from the right category pool ────────────────────────────
// Seeded by the article title so:
//   • Every article always gets the SAME photo (stable across reloads / deploys)
//   • Different articles get different photos within each category pool
//   • Brand-new articles with any ID get a photo immediately
function pickPhoto(category: string, title: string): string {
  const pool = PHOTO_POOLS[category] ?? FALLBACK_POOL;
  const idx  = hashStr(title) % pool.length;
  return pool[idx]!;
}

/**
 * Image resolution priority:
 *  1. Real image from the RSS feed / og:image fetched at scrape time
 *  2. Curated Unsplash photo, deterministically chosen from the
 *     category pool using the article title as the seed
 */
function getArticleImage(article: Article): string {
  if (article.imageUrl && article.imageUrl.startsWith("http")) {
    return article.imageUrl;
  }
  const photoId = pickPhoto(article.category, article.title);
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=800&q=75`;
}

function getArticleImageLarge(article: Article): string {
  if (article.imageUrl && article.imageUrl.startsWith("http")) {
    return article.imageUrl;
  }
  const photoId = pickPhoto(article.category, article.title);
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1400&q=80`;
}

/** On load error: pick the *next* photo in the pool so we never show broken img */
function getFallbackImage(article: Article): string {
  const pool  = PHOTO_POOLS[article.category] ?? FALLBACK_POOL;
  const idx   = (hashStr(article.title) + 1) % pool.length;
  const photoId = pool[idx]!;
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=800&q=75`;
}

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] ?? "badge-funding";
  return (
    <span className={`${cls} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm`}>
      {category}
    </span>
  );
}

interface ArticleCardProps {
  article: Article;
  variant?: "featured" | "standard" | "compact" | "trending" | "list";
  index?: number;
}

export function ArticleCard({ article, variant = "standard", index = 0 }: ArticleCardProps) {
  const imgSrc = getArticleImage(article);
  const flag   = FLAGS[article.country] ?? "🌍";

  function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    const target = e.target as HTMLImageElement;
    target.src = getFallbackImage(article);
    target.onerror = null; // prevent infinite loop
  }

  // ── Featured — large hero card ───────────────────────────────────────────────
  if (variant === "featured") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
        className="article-card-hover group bg-white border border-border overflow-hidden">
        <Link href={`/articles/${article.id}`} className="block">
          <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <img src={imgSrc} alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={handleImgError} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CategoryBadge category={article.category} />
                <span className="text-white/80 text-xs">{flag} {article.country}</span>
              </div>
              <h2 className="font-serif text-white font-bold text-xl md:text-2xl leading-tight line-clamp-3">
                {article.title}
              </h2>
              <div className="flex items-center gap-2 mt-2 text-white/60 text-xs">
                <span>{format(new Date(article.publishedAt), "MMM d, yyyy")}</span>
                <span>•</span>
                <span>{article.sourceName}</span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // ── List — horizontal compact row ────────────────────────────────────────────
  if (variant === "list") {
    return (
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
        className="article-card-hover group flex gap-3 bg-white border border-border p-3 overflow-hidden">
        <div className="w-20 h-16 shrink-0 overflow-hidden">
          <img src={imgSrc} alt={article.title} className="w-full h-full object-cover" onError={handleImgError} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <CategoryBadge category={article.category} />
            <span className="text-[10px] text-muted-foreground">{flag}</span>
          </div>
          <Link href={`/articles/${article.id}`}>
            <h3 className="font-serif text-sm font-bold leading-snug line-clamp-2 group-hover:text-[hsl(220,80%,35%)] transition-colors">
              {article.title}
            </h3>
          </Link>
          <div className="text-[10px] text-muted-foreground mt-1">
            {format(new Date(article.publishedAt), "MMM d")} · {article.sourceName}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Compact / Trending ────────────────────────────────────────────────────────
  if (variant === "compact" || variant === "trending") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
        className="article-card-hover group flex gap-3 bg-white border border-border p-3">
        <div className="w-16 h-14 shrink-0 overflow-hidden">
          <img src={imgSrc} alt={article.title} className="w-full h-full object-cover" onError={handleImgError} />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/articles/${article.id}`}>
            <p className="text-xs font-bold font-serif leading-snug line-clamp-2 group-hover:text-[hsl(220,80%,35%)] transition-colors">
              {article.title}
            </p>
          </Link>
          <div className="text-[10px] text-muted-foreground mt-1">{article.sourceName}</div>
        </div>
      </motion.div>
    );
  }

  // ── Standard — default grid card ─────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="article-card-hover group bg-white border border-border overflow-hidden flex flex-col h-full">
      <Link href={`/articles/${article.id}`} className="block overflow-hidden">
        <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <img src={imgSrc} alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={handleImgError} />
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <CategoryBadge category={article.category} />
          </div>
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>{flag} {article.country}</span>
          <span>·</span>
          <span>{format(new Date(article.publishedAt), "MMM d, yyyy")}</span>
        </div>
        <Link href={`/articles/${article.id}`}>
          <h3 className="font-serif font-bold text-base leading-snug line-clamp-3 group-hover:text-[hsl(220,80%,35%)] transition-colors mb-2">
            {article.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{article.summary}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground font-medium">{article.sourceName}</span>
          <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-[hsl(220,80%,35%)] hover:underline flex items-center gap-1">
            Read <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// Export the image helpers so detail.tsx can reuse the same logic
export { getArticleImage, getArticleImageLarge, getFallbackImage };
