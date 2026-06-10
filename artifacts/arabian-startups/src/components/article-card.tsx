import { Article } from "@workspace/api-client-react/src/generated/api.schemas";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  "Funding":                  "badge-funding",
  "Technology":               "badge-technology",
  "Ecosystem":                "badge-ecosystem",
  "Launches":                 "badge-launches",
  "Acquisitions":             "badge-acquisitions",
  "Policy":                   "badge-policy",
  "People":                   "badge-people",
  "Growth":                   "badge-growth",
  "Incubators & Accelerators":"badge-incubators",
};

const CATEGORY_IMAGES: Record<string, string> = {
  "Funding":                  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=75&auto=format",
  "Incubators & Accelerators":"https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=75&auto=format",
  "Acquisitions":             "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=75&auto=format",
  "Launches":                 "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=75&auto=format",
  "Policy":                   "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=75&auto=format",
  "People":                   "https://images.unsplash.com/photo-1553484771-371a605b060b?w=600&q=75&auto=format",
  "Growth":                   "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=75&auto=format",
  "Technology":               "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=75&auto=format",
  "Ecosystem":                "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=75&auto=format",
};

const FLAGS: Record<string, string> = { "Saudi Arabia":"🇸🇦", UAE:"🇦🇪", Kuwait:"🇰🇼", Qatar:"🇶🇦", Bahrain:"🇧🇭", Oman:"🇴🇲", GCC:"🌍" };

function getCategoryImage(category: string) {
  return CATEGORY_IMAGES[category] ?? "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75&auto=format";
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
  const imgSrc = article.imageUrl || getCategoryImage(article.category);
  const flag = FLAGS[article.country] ?? "🌍";

  // Featured — large hero card
  if (variant === "featured") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
        className="article-card-hover group bg-white border border-border overflow-hidden">
        <Link href={`/articles/${article.id}`} className="block">
          <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <img src={imgSrc} alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = getCategoryImage(article.category); }} />
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
          <img src={imgSrc} alt={article.title} className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = getCategoryImage(article.category); }} />
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
          <img src={imgSrc} alt={article.title} className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = getCategoryImage(article.category); }} />
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

  // Standard card — the default grid card
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="article-card-hover group bg-white border border-border overflow-hidden flex flex-col h-full">
      <Link href={`/articles/${article.id}`} className="block overflow-hidden">
        <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <img src={imgSrc} alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = getCategoryImage(article.category); }} />
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
