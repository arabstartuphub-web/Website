import { Layout } from "@/components/layout";
import { ArticleCard } from "@/components/article-card";
import { useListArticles, useListCategories, useListCountries } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Articles() {
  // Read URL params on load — fixes country/category filter from categories page
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get("category") || "all";
  const initialCountry = urlParams.get("country") || "all";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(initialCategory);
  const [country, setCountry] = useState<string>(initialCountry);
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Re-read URL params if they change (e.g. back/forward navigation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category") || "all";
    const cou = params.get("country") || "all";
    setCategory(cat);
    setCountry(cou);
    setPage(1);
  }, [window.location.search]);

  const { data, isLoading } = useListArticles({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
    country: country !== "all" ? country : undefined,
  });

  const { data: categories } = useListCategories();
  const { data: countries } = useListCountries();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(e.target.value);
      setPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const getFlag = (code: string) => {
    const flags: Record<string, string> = { SA: "🇸🇦", AE: "🇦🇪", KW: "🇰🇼", QA: "🇶🇦", BH: "🇧🇭", OM: "🇴🇲" };
    return flags[code] || "";
  };

  return (
    <Layout>
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Latest News</h1>

          {/* Active filter pill */}
          {(country !== "all" || category !== "all") && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {country !== "all" && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/30 text-xs font-mono px-3 py-1 uppercase tracking-wide">
                  {getFlag(country)} {countries?.find(c => c.code === country)?.country ?? country}
                  <button onClick={() => { setCountry("all"); setPage(1); }} className="ml-2 hover:text-primary/60">✕</button>
                </span>
              )}
              {category !== "all" && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/30 text-xs font-mono px-3 py-1 uppercase tracking-wide">
                  {categories?.find(c => c.slug === category)?.name ?? category}
                  <button onClick={() => { setCategory("all"); setPage(1); }} className="ml-2 hover:text-primary/60">✕</button>
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 border border-border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-9 h-10 border-none bg-muted/50 rounded-none focus-visible:ring-primary"
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex w-full md:w-auto gap-4">
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-[180px] rounded-none h-10 border-border">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(c => (
                    <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={country} onValueChange={(v) => { setCountry(v); setPage(1); }}>
                <SelectTrigger className="w-full md:w-[180px] rounded-none h-10 border-border">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries?.map(c => (
                    <SelectItem key={c.code} value={c.code}>{getFlag(c.code)} {c.country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="w-full h-80" />)}
          </div>
        ) : data?.articles && data.articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {data.articles.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-none font-mono uppercase"
              >
                Previous
              </Button>
              <div className="flex items-center px-4 font-mono text-sm">
                Page {page} of {Math.ceil(data.total / data.limit)}
              </div>
              <Button
                variant="outline"
                disabled={page >= Math.ceil(data.total / data.limit)}
                onClick={() => setPage(p => p + 1)}
                className="rounded-none font-mono uppercase"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-card border border-border">
            <h3 className="font-serif text-2xl font-bold mb-2">No articles found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            <Button
              variant="outline"
              className="mt-6 rounded-none font-serif"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setCategory("all");
                setCountry("all");
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
