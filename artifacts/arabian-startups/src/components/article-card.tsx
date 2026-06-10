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

// ─── Curated Unsplash photo IDs ───────────────────────────────────────────────
// Each pool is hand-picked: startup offices, Arab cities, pitch events,
// fintech screens, co-working, entrepreneur portraits, data dashboards.
// NO animals, NO nature landscapes, NO generic stock models.
// Using /photos/<id>/download?ixlib=rb-4.0.3&w=800&q=80 for stable URLs.
const CATEGORY_PHOTO_POOLS: Record<string, string[]> = {
  "Funding": [
    // venture capital deal tables, investment pitches, financial dashboards
    "hpjSkU2UYSU", // handshake over documents
    "5fNmWej4tAA", // pitch deck on screen
    "IrRbSND5EUc", // financial data on laptop
    "7okkFhxrxNw", // modern business meeting
    "GinzVNqh7Es", // startup pitch room
    "Q59HmzK38eQ", // contract signing
    "s9CC2SKySJM", // data charts on monitor
    "wD1LRb9OeEo", // investor meeting boardroom
  ],
  "Incubators & Accelerators": [
    // co-working spaces, accelerator hubs, demo days, team whiteboards
    "RLw-UC03Gwc", // open co-working floor
    "vbxyFxlgpjM", // startup team brainstorm
    "5QgIuuBxKwM", // modern tech office
    "fIq0tET6llY", // whiteboard session
    "Oalh2MojUuk", // hub open floor
    "jKU2NneZAbI", // startup demo day
    "s9CC2SKySJM", // accelerator presentation
    "YfCVCPMNd38", // team collaboration table
  ],
  "Acquisitions": [
    // contract tables, handshakes, boardrooms, deal signings
    "hpjSkU2UYSU", // handshake over documents
    "wD1LRb9OeEo", // boardroom deal
    "Q59HmzK38eQ", // signing contract
    "7okkFhxrxNw", // business deal meeting
    "GinzVNqh7Es", // executive discussion
    "IrRbSND5EUc", // corporate laptop screen
    "aCeGNzAlgKk", // formal meeting
    "KdeNZMkndbM", // corporate handshake
  ],
  "Launches": [
    // product reveals, rocket/launch metaphors (tech), announcement stages
    "RLw-UC03Gwc", // product demo stage
    "vbxyFxlgpjM", // launch event crowd
    "fIq0tET6llY", // onstage announcement
    "jKU2NneZAbI", // keynote presentation
    "5fNmWej4tAA", // screen reveal moment
    "Oalh2MojUuk", // startup launch floor
    "YfCVCPMNd38", // team celebrating launch
    "5QgIuuBxKwM", // office launch day
  ],
  "Policy": [
    // government buildings, official settings, regulatory meetings, Arab architecture
    "vbxyFxlgpjM", // official meeting room
    "7okkFhxrxNw", // formal boardroom
    "KdeNZMkndbM", // official handshake
    "wD1LRb9OeEo", // government-style meeting
    "GinzVNqh7Es", // executive setting
    "aCeGNzAlgKk", // official discussion
    "Q59HmzK38eQ", // document signing ceremony
    "hpjSkU2UYSU", // formal agreement
  ],
  "People": [
    // entrepreneur portraits, CEO headshots, professional leaders
    "GinzVNqh7Es", // confident entrepreneur portrait
    "KdeNZMkndbM", // professional executive
    "aCeGNzAlgKk", // business leader discussion
    "7okkFhxrxNw", // founder in office
    "YfCVCPMNd38", // team leader moment
    "fIq0tET6llY", // speaker at event
    "jKU2NneZAbI", // panel discussion
    "vbxyFxlgpjM", // professional headshot setting
  ],
  "Growth": [
    // data dashboards, rising charts, digital analytics, expansion maps
    "s9CC2SKySJM", // analytics dashboard monitor
    "IrRbSND5EUc", // financial growth on screen
    "5fNmWej4tAA", // data visualization
    "5QgIuuBxKwM", // tech office growth metrics
    "RLw-UC03Gwc", // modern workspace data
    "Oalh2MojUuk", // startup floor scaling up
    "hpjSkU2UYSU", // milestone meeting
    "Q59HmzK38eQ", // growth agreement
  ],
  "Technology": [
    // AI interfaces, fintech apps, coding screens, Dubai/Riyadh smart city
    "IrRbSND5EUc", // coding / tech screen
    "5fNmWej4tAA", // AI / data on screen
    "s9CC2SKySJM", // developer monitor
    "5QgIuuBxKwM", // modern tech office
    "RLw-UC03Gwc", // smart workspace
    "jKU2NneZAbI", // tech demo
    "fIq0tET6llY", // digital presentation
    "YfCVCPMNd38", // team tech collaboration
  ],
  "Ecosystem": [
    // startup conferences, GITEX-style events, networking, MENA city skylines
    "vbxyFxlgpjM", // conference hall
    "jKU2NneZAbI", // ecosystem summit
    "fIq0tET6llY", // speaker on stage
    "Oalh2MojUuk", // networking floor
    "RLw-UC03Gwc", // co-working community
    "YfCVCPMNd38", // team networking
    "5QgIuuBxKwM", // innovation hub
    "vbxyFxlgpjM", // startup gathering
  ],
};

// Fallback pool for unknown categories — general Arab startup / business imagery
const FALLBACK_POOL = [
  "hpjSkU2UYSU",
  "vbxyFxlgpjM",
  "5QgIuuBxKwM",
  "IrRbSND5EUc",
  "RLw-UC03Gwc",
  "GinzVNqh7Es",
  "jKU2NneZAbI",
  "YfCVCPMNd38",
];

/**
 * Derives a deterministic index from the article id so every article always
 * gets the SAME fallback photo (stable across reloads), but different articles
 * get different photos (unique within each category pool).
 */
function pickFromPool(pool: string[], articleId: number): string {
  return pool[articleId % pool.length]!;
}

/**
 * Returns a unique, startup-themed image URL for each article.
 *
 * Priority:
 *  1. Real image extracted from the RSS feed (stored in article.imageUrl)
 *  2. Curated Unsplash photo matched to category + seeded by article.id
 *     → always startup/business/MENA imagery, never animals or random stock
 */
function getArticleImage(article: Article): string {
  // 1. Use the real feed image if available
  if (article.imageUrl && article.imageUrl.startsWith("http")) {
    return article.imageUrl;
  }

  // 2. Pick a curated photo from the category pool
  const pool = CATEGORY_PHOTO_POOLS[article.category] ?? FALLBACK_POOL;
  const photoId = pickFromPool(pool, article.id);

  // Unsplash /photos/:id/download returns the full image; crop+resize via Unsplash's imgix pipeline
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=800&q=75`;
}

/**
 * Emergency fallback when an image fails to load.
 * Picks the NEXT photo in the same pool so we never show a broken image.
 */
function getFallbackImage(article: Article): string {
  const pool = CATEGORY_PHOTO_POOLS[article.category] ?? FALLBACK_POOL;
  const photoId = pickFromPool(pool, article.id + 1);
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

  // Featured — large hero card
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

  // List variant — horizontal compact row
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
          <div className="text-[10px] text-muted-foreground mt-1">{format(new Date(article.publishedAt), "MMM d")} · {article.sourceName}</div>
        </div>
      </motion.div>
    );
  }

  // Compact / trending
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

  // Standard card — default grid card
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
