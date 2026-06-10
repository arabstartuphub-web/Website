import { useGetArticle, useGetTrendingArticles } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/article-card";
import { motion } from "framer-motion";
import { Article } from "@workspace/api-client-react/src/generated/api.schemas";

// ─── Startup-themed curated Unsplash photo pools (mirrored from article-card) ─
const DETAIL_PHOTO_POOLS: Record<string, string[]> = {
  "Funding":                   ["hpjSkU2UYSU","5fNmWej4tAA","IrRbSND5EUc","7okkFhxrxNw","GinzVNqh7Es","Q59HmzK38eQ","s9CC2SKySJM","wD1LRb9OeEo"],
  "Incubators & Accelerators": ["RLw-UC03Gwc","vbxyFxlgpjM","5QgIuuBxKwM","fIq0tET6llY","Oalh2MojUuk","jKU2NneZAbI","s9CC2SKySJM","YfCVCPMNd38"],
  "Acquisitions":              ["hpjSkU2UYSU","wD1LRb9OeEo","Q59HmzK38eQ","7okkFhxrxNw","GinzVNqh7Es","IrRbSND5EUc","aCeGNzAlgKk","KdeNZMkndbM"],
  "Launches":                  ["RLw-UC03Gwc","vbxyFxlgpjM","fIq0tET6llY","jKU2NneZAbI","5fNmWej4tAA","Oalh2MojUuk","YfCVCPMNd38","5QgIuuBxKwM"],
  "Policy":                    ["vbxyFxlgpjM","7okkFhxrxNw","KdeNZMkndbM","wD1LRb9OeEo","GinzVNqh7Es","aCeGNzAlgKk","Q59HmzK38eQ","hpjSkU2UYSU"],
  "People":                    ["GinzVNqh7Es","KdeNZMkndbM","aCeGNzAlgKk","7okkFhxrxNw","YfCVCPMNd38","fIq0tET6llY","jKU2NneZAbI","vbxyFxlgpjM"],
  "Growth":                    ["s9CC2SKySJM","IrRbSND5EUc","5fNmWej4tAA","5QgIuuBxKwM","RLw-UC03Gwc","Oalh2MojUuk","hpjSkU2UYSU","Q59HmzK38eQ"],
  "Technology":                ["IrRbSND5EUc","5fNmWej4tAA","s9CC2SKySJM","5QgIuuBxKwM","RLw-UC03Gwc","jKU2NneZAbI","fIq0tET6llY","YfCVCPMNd38"],
  "Ecosystem":                 ["vbxyFxlgpjM","jKU2NneZAbI","fIq0tET6llY","Oalh2MojUuk","RLw-UC03Gwc","YfCVCPMNd38","5QgIuuBxKwM","vbxyFxlgpjM"],
};
const DETAIL_FALLBACK = ["hpjSkU2UYSU","vbxyFxlgpjM","5QgIuuBxKwM","IrRbSND5EUc","RLw-UC03Gwc","GinzVNqh7Es","jKU2NneZAbI","YfCVCPMNd38"];

function getDetailImage(article: Article): string {
  if (article.imageUrl && article.imageUrl.startsWith("http")) return article.imageUrl;
  const pool = DETAIL_PHOTO_POOLS[article.category] ?? DETAIL_FALLBACK;
  const photoId = pool[article.id % pool.length]!;
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1400&q=80`;
}

export default function ArticleDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  
  const { data: article, isLoading, error } = useGetArticle(id, { 
    query: { 
      queryKey: ["/api/articles", id], // using raw key for brevity
      enabled: !!id 
    } 
  });

  const { data: trending } = useGetTrendingArticles({ limit: 3 });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-3/4 mb-8" />
          <Skeleton className="w-full aspect-video mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild variant="outline" className="rounded-none font-serif">
            <Link href="/articles">Return to Articles</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const getFlag = (code: string) => {
    const flags: Record<string, string> = { SA: "🇸🇦", AE: "🇦🇪", KW: "🇰🇼", QA: "🇶🇦", BH: "🇧🇭", OM: "🇴🇲" };
    return flags[code] || code;
  };

  return (
    <Layout>
      <article className="bg-background">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
          <Link href="/articles" className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-primary mb-8 uppercase tracking-wider transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to News
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-6 font-mono text-xs font-bold uppercase tracking-wider">
            <Link href={`/articles?category=${article.category.toLowerCase()}`}>
              <span className="text-primary hover:underline cursor-pointer">{article.category}</span>
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center gap-1">
              <span>{getFlag(article.country)}</span> {article.country}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{format(new Date(article.publishedAt), "MMMM dd, yyyy")}</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            {article.title}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-serif italic mb-8 border-l-4 border-primary pl-6">
            {article.summary}
          </p>

          <div className="flex items-center justify-between border-y border-border py-4 mb-8">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <span>Source:</span>
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                {article.sourceName} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-none border-border">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Image — always shown; uses real feed image or curated startup fallback */}
        <div className="container mx-auto px-4 max-w-5xl mb-12">
          <div className="aspect-[21/9] w-full bg-muted relative overflow-hidden shadow-lg">
            <img
              src={getDetailImage(article)}
              alt={article.title}
              className="object-cover w-full h-full"
              onError={(e) => {
                const pool = DETAIL_PHOTO_POOLS[article.category] ?? DETAIL_FALLBACK;
                const next = pool[(article.id + 1) % pool.length]!;
                (e.target as HTMLImageElement).src =
                  `https://images.unsplash.com/photo-${next}?auto=format&fit=crop&w=1400&q=80`;
                (e.target as HTMLImageElement).onerror = null;
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 pb-16 max-w-3xl">
          <div className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-p:font-sans prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 max-w-none">
            {article.content ? (
              <div dangerouslySetContent={{__html: article.content}} />
            ) : (
              <p>Full content is available at the original source.</p>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span key={tag} className="bg-muted text-muted-foreground px-3 py-1 text-xs font-mono uppercase tracking-wider">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Read Original CTA */}
          <div className="mt-12 bg-card border border-border p-8 text-center">
            <h3 className="font-serif text-2xl font-bold mb-4">Read Full Article</h3>
            <p className="text-muted-foreground mb-6">This is a summary. Read the full article on {article.sourceName}.</p>
            <Button asChild size="lg" className="rounded-none font-serif tracking-wide px-8">
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                Read on {article.sourceName} <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </article>

      {/* Related/Trending Section */}
      <div className="bg-muted/30 border-t border-border py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="font-serif text-2xl font-bold uppercase tracking-tight border-b-2 border-foreground pb-2 mb-8">
            More Intelligence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trending?.map((item, i) => (
              <ArticleCard key={item.id} article={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}