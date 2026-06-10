
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

// Curated picsum.photos IDs relevant to each startup/business category.
// 8 IDs per category — article.id % 8 picks one, so every article gets a
// different photo within the category, stable across page reloads.
const CATEGORY_PHOTO_IDS: Record<string, number[]> = {
  "Funding":                   [3184, 669, 1181, 574, 6801, 7376, 4458, 3153],
  "Incubators & Accelerators": [1595, 1181, 3184, 1084, 3861, 3182, 1438, 2182],
  "Acquisitions":              [3182, 3760, 1181, 3184, 1036, 3760, 1181, 3184],
  "Launches":                  [3861, 1181, 3760, 3184, 3861, 1181, 3760, 3184],
  "Policy":                    [1036, 3182, 3760, 3184, 1036, 3182, 3760, 3184],
  "People":                    [1181, 3182, 3760, 3184, 1181, 3182, 3760, 3184],
  "Growth":                    [186,  590,  669,  3184, 186,  590,  830,  6801],
  "Technology":                [373,  325,  442,  574,  373,  325,  442,  602],
  "Ecosystem":                 [1181, 1595, 3184, 3861, 1181, 1595, 3184, 3861],
};

/**
 * Image priority:
 * 1. Real image from the RSS feed source (article.imageUrl) — always preferred
 * 2. Fallback: category-relevant picsum photo seeded by article.id
 *    — unique per article, stable, topically relevant
 */
function getArticleImage(article: Article): string {
  if (article.imageUrl && article.imageUrl.startsWith("http")) {
    return article.imageUrl;
  }
  const ids = CATEGORY_PHOTO_IDS[article.category] ?? CATEGORY_PHOTO_IDS["Technology"]!;
  const photoId = ids[article.id % ids.length]!;
  return `https://picsum.photos/id/${photoId}/800/450`;
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

  // On image load error: try next photo ID in the category pool
  function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    const target = e.target as HTMLImageElement;
    const ids = CATEGORY_PHOTO_IDS[article.category] ?? CATEGORY_PHOTO_IDS["Technology"]!;
    const nextId = ids[(article.id + 1) % ids.length]!;
    target.src = `https://picsum.photos/id/${nextId}/800/450`;
    target.onerror = null; // prevent infinite loop
  }

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

  // Standard grid card
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
