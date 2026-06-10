import { Layout } from "@/components/layout";
import { ArticleCard } from "@/components/article-card";
import { useListArticles, useListCategories, useListCountries } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

// Read initial filters from URL params
function getInitialFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category") || "all",
    country: params.get("country") || "all",
    search: params.get("search") || "",
  };
}

// Active filter pill
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs font-mono px-3 py-1 uppercase tracking-wider">
      {label}
      <button onClick={onRemove} className="ml-1 hover:text-destructive font-bold">×</button>
    </span>
  );
}

export default function Articles() {
  const initial = getInitialFilters();
  const [search, setSearch] = useState(initial.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initial.search);
  const [category, setCategory] = useState<string>(initial.category);
  const [country, setCountry] = useState<string>(initial.country);
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();

  // Sync URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (country !== "all") params.set("country", country);
    if (debouncedSearch) params.set("search", debouncedSearch);
    const qs = params.toString();
    setLocation(qs ? `/articles?${qs}` : "/articles", { replace: true });
  }, [category, country, debouncedSearch]);

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
    const id = setTimeout(() => { setDebouncedSearch(e.target.value); setPage(1); }, 500);
    return () => clearTimeout(id);
  };

  const clearAll = () => {
    setSearch(""); setDebouncedSearch(""); setCategory("all"); setCountry("all"); setPage(1);
  };

  // Find display names for active filters
  const activeCategoryName = category !== "all" ? categories?.find(c => c.slug === category)?.name : null;
  const activeCountryName = country !== "all" ? countries?.find(c => c.code === country)?.country : null;
  const hasActiveFilters = category !== "all" || country !== "all" || debouncedSearch;

  return (
    <Layout>
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Latest News</h1>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeCategoryName && <FilterPill label={activeCategoryName} onRemove={() => { setCategory("all"); setPage(1); }} />}
              {activeCountryName && <FilterPill label={activeCountryName} onRemove={() => { setCountry("all"); setPage(1); }} />}
              {debouncedSearch && <FilterPill label={`"${debouncedSearch}"`} onRemove={() => { setSearch(""); setDebouncedSearch(""); setPage(1); }} />}
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
                    <SelectItem key={c.code} value={c.code}>{c.country}</SelectItem>
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
            <div className="text-sm text-muted-foreground font-mono mb-6 uppercase tracking-wider">
              {data.total} article{data.total !== 1 ? "s" : ""} found
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {data.articles.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))}
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-none font-mono uppercase">
                Previous
              </Button>
              <div className="flex items-center px-4 font-mono text-sm">
                Page {page} of {Math.ceil(data.total / data.limit)}
              </div>
              <Button variant="outline" disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage(p => p + 1)} className="rounded-none font-mono uppercase">
                Next
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-card border border-border">
            <h3 className="font-serif text-2xl font-bold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
            <Button variant="outline" className="rounded-none font-serif" onClick={clearAll}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
