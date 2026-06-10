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

// Unsplash topic IDs — each category maps to a curated topic
// Using ?sig=<articleId> makes EACH article get a unique but stable photo
const CATEGORY_UNSPLASH_TOPICS: Record<string, string> = {
  "Funding":                   "business-finance",
  "Incubators & Accelerators": "startup-office",
  "Acquisitions":              "business-meeting",
  "Launches":                  "product-launch",
  "Policy":                    "government",
  "People":                    "portrait-professional",
  "Growth":                    "data-analytics",
  "Technology":                "technology",
  "Ecosystem":                 "community",
};

// Unsplash search terms per category for varied unique images
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  "Funding":                   ["venture capital", "investment", "startup funding", "business deal", "finance"],
  "Incubators & Accelerators": ["startup workspace", "coworking", "accelerator", "team collaboration", "innovation hub"],
  "Acquisitions":              ["business handshake", "merger", "corporate deal", "partnership", "agreement"],
  "Launches":                  ["product launch", "rocket launch", "new beginning", "startup", "announcement"],
  "Policy":                    ["government", "policy", "regulation", "legislation", "official"],
  "People":                    ["entrepreneur", "ceo", "business leader", "professional", "executive"],
  "Growth":                    ["growth chart", "data analytics", "success", "progress", "milestone"],
  "Technology":                ["technology", "artificial intelligence", "fintech", "innovation", "digital"],
  "Ecosystem":                 ["startup ecosystem", "conference", "networking", "community", "summit"],
};

/**
 * Returns a unique stable image URL for each article.
 * - If the feed provided a real image, use it.
 * - Otherwise, use Unsplash source API with article.id as seed (?sig=id)
 *   so every article gets a different photo, but the same article always
 *   shows the same photo (stable across page reloads).
 */
function getArticleImage(article: Article): string {
  // Use real image from feed if available
  if (article.imageUrl && article.imageUrl.startsWith("http")) {
    return article.imageUrl;
  }

  // Pick a search term based on article id (cycles through the list)
  const terms = CATEGORY_SEARCH_TERMS[article.category] ?? CATEGORY_SEARCH_TERMS["Technology"]!;
  const term  = terms[article.id % terms.length]!;

  // Unsplash source API: unique photo per sig, 800x450 crop
  return `https://picsum.photos/seed/${article.id}/800/450`;
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

  // On image load error fall back to a different photo
  function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    const target = e.target as HTMLImageElement;
    const terms  = CATEGORY_SEARCH_TERMS[article.category] ?? CATEGORY_SEARCH_TERMS["Technology"]!;
    const term   = terms[(article.id + 1) % terms.length]!;
    target.src = `https://picsum.photos/seed/${article.id + 999}/800/450`; 
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
