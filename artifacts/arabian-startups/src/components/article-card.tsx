import { Article } from "@workspace/api-client-react/src/generated/api.schemas";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface ArticleCardProps {
  article: Article;
  variant?: "featured" | "standard" | "compact" | "trending";
  index?: number;
}

export function ArticleCard({ article, variant = "standard", index = 0 }: ArticleCardProps) {
  const getFlag = (code: string) => {
    const flags: Record<string, string> = {
      SA: "🇸🇦",
      AE: "🇦🇪",
      KW: "🇰🇼",
      QA: "🇶🇦",
      BH: "🇧🇭",
      OM: "🇴🇲"
    };
    return flags[code] || code;
  };

  if (variant === "featured") {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group relative overflow-hidden rounded-none border border-border bg-card hover-elevate transition-all duration-300"
      >
        <Link href={`/articles/${article.id}`} className="block h-full">
          <div className="aspect-[16/9] w-full bg-muted relative overflow-hidden">
            {article.imageUrl ? (
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                <span className="font-serif text-4xl text-primary/20 block">ASE</span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 uppercase tracking-wider">
                {article.category}
              </span>
              <span className="bg-background text-foreground text-xs font-bold px-3 py-1 flex items-center gap-1 shadow-sm">
                <span>{getFlag(article.country)}</span> {article.country}
              </span>
            </div>
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 uppercase tracking-wider font-mono">
                <span>{format(new Date(article.publishedAt), "MMM dd, yyyy")}</span>
                <span>•</span>
                <span>{article.sourceName}</span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <p className="text-muted-foreground text-base line-clamp-3 mb-6">
                {article.summary}
              </p>
            </div>
            <div className="flex items-center text-sm font-semibold text-primary uppercase tracking-wide">
              Read Story <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (variant === "trending") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Link href={`/articles/${article.id}`} className="group flex gap-4 items-start pb-6 border-b border-border/50 last:border-0 last:pb-0">
          <div className="text-3xl font-serif text-muted-foreground/30 font-bold group-hover:text-primary transition-colors">
            {(index + 1).toString().padStart(2, '0')}
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-mono">
              <span className="text-primary font-bold">{article.category}</span>
              <span>•</span>
              <span>{getFlag(article.country)}</span>
            </div>
            <h4 className="font-serif text-base font-bold leading-tight group-hover:text-primary transition-colors">
              {article.title}
            </h4>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group flex flex-col border border-border bg-card hover-elevate transition-all duration-300 h-full"
    >
      <Link href={`/articles/${article.id}`} className="flex flex-col h-full">
        {article.imageUrl && (
          <div className="aspect-[3/2] w-full overflow-hidden">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {article.category}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {getFlag(article.country)}
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold leading-tight mb-3 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
            {article.summary}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 text-xs text-muted-foreground font-mono">
            <span>{format(new Date(article.publishedAt), "MMM dd")}</span>
            <span className="uppercase">{article.sourceName}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}