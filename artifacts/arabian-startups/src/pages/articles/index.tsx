import { Layout } from "@/components/layout";
import { ArticleCard } from "@/components/article-card";
import { useListArticles, useListCategories, useListCountries } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearch, useLocation } from "wouter";

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs font-mono px-3 py-1 uppercase tracking-wider">
      {label}
      <button onClick={onRemove} className="ml-1 hover:text-destructive font-bold">×</button>
    </span>
  );
}

export default function Articles() {
  // useSearch() from wouter v3 — re-renders automatically whenever the URL
  // query string changes, including when <Link> navigates here from categories page
  const searchString = useSearch();
  const [, setLocation] = useLocation();

  const params     = new URLSearchParams(searchString);
  const urlCategory = params.get("category") || "all";
  const urlCountry  = params.get("country")  || "all";
  const urlSearch   = params.get("search")   || "";

  // Local state only for the search input typing (debounce)
  const [searchInput,    setSearchInput]    = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [page, setPage] = useState(1);

  // When URL params change (e.g. user navigates back/forward or clicks a new category card),
  // sync the search input and reset page
  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch);
    setPage(1);
  }, [searchString]); // re-runs every time the URL search string changes

  // Push new filter values into the URL — wouter's useSearch() will pick it up automatically
  function updateURL(category: string, country: string, search: string) {
    const p = new URLSearchParams();
    if (category !== "all") p.set("category", category);
    if (country  !== "all") p.set("country",  country);
    if (search)             p.set("search",   search);
    const qs = p.toString();
    setLocation(qs ? `/articles?${qs}` : "/articles");
  }

  function handleCategoryChange(v: string) {
    setPage(1);
    updateURL(v, urlCountry, debouncedSearch);
  }

  function handleCountryChange(v: string) {
    setPage(1);
    updateURL(urlCategory, v, debouncedSearch);
  }

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout((handleSearchInput as any)._t);
    (handleSearchInput as any)._t = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
      updateURL(urlCategory, urlCountry, val);
    }, 500);
  }

  function clearAll() {
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
    setLocation("/articles");
  }

  const { data, isLoading } = useListArticles({
    page,
    limit: 12,
    search:   debouncedSearch || undefined,
    category: urlCategory !== "all" ? urlCategory : undefined,
    country:  urlCountry  !== "all" ? urlCountry  : undefined,
  });

  const { data: categories } = useListCategories();
  const { data: countries }  = useListCountries();

  const hasActiveFilters = urlCategory !== "all" || urlCountry !== "all" || debouncedSearch;

  return (
    <Layout>
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">Latest News</h1>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              {urlCategory !== "all" && (
                <FilterPill label={urlCategory} onRemove={() => handleCategoryChange("all")} />
              )}
              {urlCountry !== "all" && (
                <FilterPill label={urlCountry} onRemove={() => handleCountryChange("all")} />
              )}
              {debouncedSearch && (
                <FilterPill label={`"${debouncedSearch}"`} onRemove={() => {
                  setSearchInput(""); setDebouncedSearch("");
                  updateURL(urlCategory, urlCountry, "");
                }} />
              )}
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground underline font-mono ml-1">
                clear all
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 border border-border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-9 h-10 border-none bg-muted/50 rounded-none focus-visible:ring-primary"
                value={searchInput}
                onChange={handleSearchInput}
              />
            </div>

            <div className="flex w-full md:w-auto gap-4">
              <Select value={urlCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-[180px] rounded-none h-10 border-border">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(c => (
                    <SelectItem key={c.slug} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={urlCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-full md:w-[180px] rounded-none h-10 border-border">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries?.map(c => (
                    <SelectItem key={c.code} value={c.country}>{c.country}</SelectItem>
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
              <Button variant="outline" disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-none font-mono uppercase">
                Previous
              </Button>
              <div className="flex items-center px-4 font-mono text-sm">
                Page {page} of {Math.ceil(data.total / data.limit)}
              </div>
              <Button variant="outline" disabled={page >= Math.ceil(data.total / data.limit)}
                onClick={() => setPage(p => p + 1)}
                className="rounded-none font-mono uppercase">
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
