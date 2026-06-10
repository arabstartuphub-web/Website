import { useGetEcosystemStats, useGetFeaturedArticles, useGetLatestDigest, useGetTrendingArticles, useListArticles } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { ArticleCard } from "@/components/article-card";
import { NewsletterCTA } from "@/components/newsletter-cta";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

// All 6 GCC countries with flags
const GCC_COUNTRIES: Record<string, { flag: string; name: string }> = {
  SA: { flag: "🇸🇦", name: "Saudi Arabia" },
  AE: { flag: "🇦🇪", name: "UAE" },
  KW: { flag: "🇰🇼", name: "Kuwait" },
  QA: { flag: "🇶🇦", name: "Qatar" },
  BH: { flag: "🇧🇭", name: "Bahrain" },
  OM: { flag: "🇴🇲", name: "Oman" },
};

// Category sections for homepage feed (like menastartupdigest.com)
const FEED_SECTIONS = [
  { category: "Funding",                  label: "Latest Funding Rounds",      emoji: "💰" },
  { category: "Incubators & Accelerators",label: "Programs & Accelerators",    emoji: "🚀" },
  { category: "Ecosystem",                label: "Ecosystem Updates",          emoji: "🌱" },
  { category: "Technology",               label: "Tech & Innovation",          emoji: "⚡" },
];

export default function Home() {
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedArticles();
  const { data: trending, isLoading: trendingLoading } = useGetTrendingArticles({ limit: 5 });
  const { data: latestArticles, isLoading: latestLoading } = useListArticles({ limit: 6 });
  const { data: stats, isLoading: statsLoading } = useGetEcosystemStats();
  const { data: digest, isLoading: digestLoading } = useGetLatestDigest();

  // Per-category feeds
  const { data: fundingArticles }     = useListArticles({ limit: 4, category: "Funding" });
  const { data: programArticles }     = useListArticles({ limit: 4, category: "Incubators & Accelerators" });
  const { data: ecosystemArticles }   = useListArticles({ limit: 4, category: "Ecosystem" });
  const { data: techArticles }        = useListArticles({ limit: 4, category: "Technology" });

  const sectionData: Record<string, typeof latestArticles> = {
    "Funding": fundingArticles,
    "Incubators & Accelerators": programArticles,
    "Ecosystem": ecosystemArticles,
    "Technology": techArticles,
  };

  return (
    <Layout>
      {/* Header Date & Stats Bar — all 6 GCC countries */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center text-xs font-mono uppercase tracking-widest text-muted-foreground gap-4">
          <div className="flex items-center gap-4">
            <span className="text-foreground font-bold">{format(new Date(), "EEEE, MMMM dd, yyyy")}</span>
            <span className="hidden md:inline">Volume I, Issue {stats?.weekCount || "..."}</span>
          </div>
          {stats ? (
            <div className="flex gap-3 md:gap-6 overflow-x-auto">
              <span><strong className="text-foreground">{stats.todayCount}</strong> Today</span>
              <span className="hidden sm:inline"><strong className="text-foreground">{stats.totalFundingMentions}</strong> Funding</span>
              {/* Show ALL 6 GCC countries, filling in 0 for missing ones */}
              <div className="flex gap-3">
                {Object.entries(GCC_COUNTRIES).map(([code, meta]) => {
                  const found = stats.articlesByCountry.find(c => c.code === code);
                  return (
                    <Link key={code} href={`/articles?country=${encodeURIComponent(meta.name)}`} title={meta.name}>
                      <span className="hover:text-foreground transition-colors cursor-pointer">
                        {meta.flag} <strong className="text-foreground">{found?.articleCount ?? 0}</strong>
                      </span>
                    </Link>
                  );
                })}
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

        {/* LinkedIn CTA */}
        <div className="mb-16">
          <NewsletterCTA />
        </div>

        {/* Latest News Feed */}
        <div className="mb-16">
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

        {/* Category Feed Sections — like menastartupdigest.com */}
        {FEED_SECTIONS.map((section, si) => {
          const sectionArticles = sectionData[section.category]?.articles;
          if (!sectionArticles || sectionArticles.length === 0) return null;
          return (
            <motion.div
              key={section.category}
              className="mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.1 }}
            >
              <div className="mb-8 flex items-end justify-between border-b-2 border-foreground pb-2">
                <h2 className="font-serif text-2xl font-bold uppercase tracking-tight">
                  <span className="mr-2">{section.emoji}</span>{section.label}
                </h2>
                <Link
                  href={`/articles?category=${encodeURIComponent(section.category)}`}
                  className="text-sm font-mono font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sectionArticles.map((article, i) => (
                  <ArticleCard key={article.id} article={article} index={i} />
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Country Sections — per GCC country like menastartupdigest.com */}
        <div className="mb-16">
          <div className="mb-8 border-b-2 border-foreground pb-2">
            <h2 className="font-serif text-2xl font-bold uppercase tracking-tight">Browse by Country</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(GCC_COUNTRIES).map(([code, meta]) => {
              const found = stats?.articlesByCountry.find(c => c.code === code);
              return (
                <Link key={code} href={`/articles?country=${encodeURIComponent(meta.name)}`}>
                  <div className="border border-border bg-card p-4 text-center hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer">
                    <div className="text-3xl mb-2">{meta.flag}</div>
                    <div className="font-serif font-bold text-xs uppercase tracking-wide group-hover:text-primary transition-colors">{meta.name}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{found?.articleCount ?? 0} updates</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </Layout>
  );
}
