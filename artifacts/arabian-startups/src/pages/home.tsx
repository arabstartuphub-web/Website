import { useGetEcosystemStats, useGetFeaturedArticles, useGetLatestDigest, useGetTrendingArticles, useListArticles } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ArticleCard } from "@/components/article-card";
import { NewsletterCTA } from "@/components/newsletter-cta";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Home() {
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedArticles();
  const { data: trending, isLoading: trendingLoading } = useGetTrendingArticles({ limit: 5 });
  const { data: latestArticles, isLoading: latestLoading } = useListArticles({ limit: 6 });
  const { data: stats, isLoading: statsLoading } = useGetEcosystemStats();
  const { data: digest, isLoading: digestLoading } = useGetLatestDigest();

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

  return (
    <Layout>
      {/* Header Date & Stats Bar */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center text-xs font-mono uppercase tracking-widest text-muted-foreground gap-4">
          <div className="flex items-center gap-4">
            <span className="text-foreground font-bold">{format(new Date(), "EEEE, MMMM dd, yyyy")}</span>
            <span className="hidden md:inline">Volume I, Issue {stats?.weekCount || "..."}</span>
          </div>
          {stats ? (
            <div className="flex gap-4 md:gap-8 overflow-x-auto">
              <span><strong className="text-foreground">{stats.todayCount}</strong> Updates Today</span>
              <span className="hidden sm:inline"><strong className="text-foreground">{stats.totalFundingMentions}</strong> Funding Rounds</span>
              <div className="flex gap-2">
                {stats.articlesByCountry.slice(0, 4).map(c => (
                  <span key={c.code} title={c.country}>{getFlag(c.code)} {c.articleCount}</span>
                ))}
              </div>
            </div>
          ) : (
            <Skeleton className="h-4 w-48" />
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* Top Section: Featured + Digest/Trending */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
          {/* Main Featured */}
          <div className="lg:col-span-8">
            <div className="mb-6 flex items-center justify-between border-b-2 border-foreground pb-2">
              <h2 className="font-serif text-2xl font-bold uppercase tracking-tight">Top Story</h2>
            </div>
            {featuredLoading ? (
              <Skeleton className="w-full aspect-[16/9]" />
            ) : featured && featured.length > 0 ? (
              <ArticleCard article={featured[0]} variant="featured" />
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Digest Card */}
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-border pb-2">
                <h2 className="font-serif text-xl font-bold uppercase tracking-tight text-primary">Daily Briefing</h2>
              </div>
              {digestLoading ? (
                <Skeleton className="w-full h-64" />
              ) : digest ? (
                <div className="bg-primary/5 border border-primary/20 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -z-10" />
                  <div className="text-sm font-mono text-primary mb-2 uppercase">{format(new Date(digest.date), "MMM dd")}</div>
                  <h3 className="font-serif text-xl font-bold mb-3">Today's Executive Summary</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-4">{digest.summary}</p>
                  <ul className="space-y-2 mb-6">
                    {digest.highlights.slice(0, 3).map((h, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span className="line-clamp-1">{h}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="w-full rounded-none font-serif border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    <Link href="/digest/latest">Read Full Briefing</Link>
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Trending */}
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-border pb-2">
                <h2 className="font-serif text-xl font-bold uppercase tracking-tight">Trending Now</h2>
              </div>
              <div className="flex flex-col">
                {trendingLoading ? (
                  Array(4).fill(0).map((_, i) => <Skeleton key={i} className="w-full h-16 mb-4" />)
                ) : trending ? (
                  trending.map((article, i) => (
                    <ArticleCard key={article.id} article={article} variant="trending" index={i} />
                  ))
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="mb-16">
          <NewsletterCTA />
        </div>

        {/* Latest News Feed */}
        <div className="mb-12">
          <div className="mb-8 flex items-end justify-between border-b-2 border-foreground pb-2">
            <h2 className="font-serif text-2xl font-bold uppercase tracking-tight">Latest Intelligence</h2>
            <Link href="/articles" className="text-sm font-mono font-bold text-primary hover:underline uppercase tracking-wider">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestLoading ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="w-full h-80" />)
            ) : latestArticles?.articles ? (
              latestArticles.articles.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}