import { useGetLatestDigest } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArticleCard } from "@/components/article-card";
import { NewsletterCTA } from "@/components/newsletter-cta";

export default function LatestDigest() {
  const { data: digest, isLoading } = useGetLatestDigest();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Skeleton className="h-12 w-64 mx-auto mb-8" />
          <Skeleton className="h-6 w-32 mx-auto mb-16" />
          <Skeleton className="h-32 w-full mb-8" />
          <div className="space-y-4 mb-16">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!digest) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">No Digest Available</h1>
          <p className="text-muted-foreground">Today's digest hasn't been published yet.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Digest Header */}
      <div className="bg-card border-b border-border py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="inline-block border-2 border-primary text-primary font-mono text-sm font-bold uppercase tracking-widest px-4 py-1 mb-6">
            The Daily Briefing
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Ecosystem Synthesis
          </h1>
          <div className="text-muted-foreground font-mono uppercase tracking-widest border-t border-b border-border/50 py-3 inline-block">
            {format(new Date(digest.date), "EEEE, MMMM dd, yyyy")}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Executive Summary */}
        <div className="mb-16">
          <h2 className="font-serif text-2xl font-bold uppercase tracking-tight border-b-2 border-foreground pb-2 mb-6 text-primary">
            Executive Summary
          </h2>
          <p className="text-xl md:text-2xl font-serif leading-relaxed text-foreground/90">
            {digest.summary}
          </p>
        </div>

        {/* Highlights */}
        <div className="bg-primary/5 border border-primary/20 p-8 md:p-10 mb-16">
          <h2 className="font-serif text-2xl font-bold uppercase tracking-tight mb-6">
            Key Developments
          </h2>
          <ul className="space-y-4">
            {digest.highlights.map((highlight, i) => (
              <li key={i} className="flex gap-4">
                <span className="text-primary font-bold mt-1 text-xl leading-none">0{i+1}.</span>
                <span className="text-lg text-foreground/80">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Included Articles */}
        {digest.articles && digest.articles.length > 0 && (
          <div className="mb-16">
            <h2 className="font-serif text-2xl font-bold uppercase tracking-tight border-b-2 border-foreground pb-2 mb-8">
              Full Coverage ({digest.articleCount})
            </h2>
            <div className="flex flex-col gap-6">
              {digest.articles.map((article, i) => (
                <div key={article.id} className="border border-border bg-card p-4 flex flex-col md:flex-row gap-6">
                  {article.imageUrl && (
                    <div className="w-full md:w-1/3 aspect-video md:aspect-auto shrink-0 bg-muted">
                      <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground mb-2">
                      <span className="text-primary font-bold">{article.category}</span>
                      <span>•</span>
                      <span>{article.country}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold mb-2 hover:text-primary transition-colors cursor-pointer">
                      <a href={`/articles/${article.id}`}>{article.title}</a>
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <NewsletterCTA />
    </Layout>
  );
}